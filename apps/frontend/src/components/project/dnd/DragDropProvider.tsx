'use client';

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { projectStore } from '@smart/store/project';
import { getProjectSocketManager } from '@smart/store/realtime';
import Column from '@smart/components/project/board/Column';
import { Card } from '@smart/components/project/board/Card';
import { DndMonitor } from './DndMonitor';
import { DragContext } from './DragContext';
import { useUserStore } from '@smart/store/user';

interface Props {
  children: React.ReactNode;
  boardTypes?: Record<string, 'board' | 'inbox' | 'calendar'>;
}

export default function DragDropProvider({ children, boardTypes = {} }: Props) {
  const { currentProject } = projectStore();
  const socket = getProjectSocketManager();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [overData, setOverData] = useState<any>(null);

  const columnScrollContainers = useRef(new Map<string, HTMLElement>());
  const boardScrollContainers = useRef(new Map<string, HTMLElement>());
  
  const currentUserId = useUserStore.getState().currentUser?.id;
  const registerScrollContainer = useCallback(
    (columnId: string, node: HTMLElement | null) => {
      if (!columnId) return;
      const containers = columnScrollContainers.current;
      if (!node) {
        containers.delete(columnId);
      } else {
        containers.set(columnId, node);
      }
    },
    []
  );

  const registerBoardScrollContainer = useCallback(
    (boardId: string, node: HTMLElement | null) => {
      if (!boardId) return;
      const containers = boardScrollContainers.current;
      if (!node) {
        containers.delete(boardId);
      } else {
        containers.set(boardId, node);
      }
    },
    []
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const getColumnCardIds = (columnId: string): string[] => {
    return projectStore.getState().columnCards[columnId] ?? [];
  };

  const findDropIndex = (over: any, items: string[]): number => {
    if (!over) return items.length;
    if (over.data?.current?.type === 'CARD') {
      const idx = items.indexOf(String(over.id));
      return idx === -1 ? items.length : idx;
    }
    if (items.includes(String(over.id))) {
      return items.indexOf(String(over.id));
    }
    return items.length;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveItem(active.data.current);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id ?? null);
    setOverData(over?.data?.current ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Nếu over là calendar thì KHÔNG cập nhật lại overData (để giữ start/end đúng)
    if (over?.data?.current?.type !== 'CALENDAR') {
      setOverData(over?.data?.current ?? null);
    }

    if (!over || !currentProject?.id || !activeItem) {
      setActiveId(null);
      setOverId(null);
      setActiveItem(null);
      setOverData(null);
      return;
    }

    // Lấy overData từ state, vì nó có thể chứa start/end nếu là calendar
    const currentOverData = overData;

    const ctrlPressed =
      (event.activatorEvent as MouseEvent)?.ctrlKey ||
      (event.activatorEvent as MouseEvent)?.metaKey;

    const projectId = currentProject.id;

    if (activeItem.type === 'COLUMN') {
      const srcBoardId = activeItem.boardId;
      const destBoardId = currentOverData?.boardId ?? srcBoardId;
      const columnId = String(active.id);

      if (
        boardTypes[srcBoardId] === 'board' &&
        boardTypes[destBoardId] === 'board' &&
        srcBoardId === destBoardId
      ) {
        const state = projectStore.getState();
        const columnIds = state.boardColumns[destBoardId] || [];
        const activeIndex = columnIds.indexOf(columnId);

        if (activeIndex === -1) {
          setActiveId(null);
          setOverId(null);
          setActiveItem(null);
          setOverData(null);
          return;
        }

        let destIndex = activeIndex;

        if (currentOverData?.type === 'COLUMN' && over.id !== active.id) {
          const overIndex = columnIds.indexOf(String(over.id));
          if (overIndex !== -1) {
            destIndex = overIndex;
          }
        }

        if (destIndex !== activeIndex) {
          projectStore
            .getState()
            .moveColumn(srcBoardId, destBoardId, columnId, destIndex);

          socket.moveColumn(projectId, srcBoardId, destBoardId, columnId, destIndex);
        }
      }

      setActiveId(null);
      setOverId(null);
      setActiveItem(null);
      setOverData(null);
      return;
    }

    function isCalendar(type: string | undefined): type is 'calendar' {
      return type === 'calendar';
    }

    if (activeItem.type === 'CARD') {
      const srcBoardId = activeItem.boardId;
      const destBoardId = currentOverData?.boardId ?? srcBoardId;
      const srcColumnId = activeItem.columnId;

      if (currentOverData?.type === 'CALENDAR') {
        const payload = {
          cardId: String(active.id),
          srcBoardId,
          destBoardId: currentOverData.boardId,
          start: currentOverData.start,
          end: currentOverData.end,
          userId: currentUserId,
        };
        console.log(payload);
      }

      const srcBoardType = boardTypes[srcBoardId] as
        | 'board'
        | 'inbox'
        | 'calendar'
        | undefined;
      const destBoardType = boardTypes[destBoardId] as
        | 'board'
        | 'inbox'
        | 'calendar'
        | undefined;

      if (isCalendar(destBoardType)) {
        const start = currentOverData?.start;
        const end = currentOverData?.end;

        const payload = {
          cardId: String(active.id),
          srcBoardId,
          destBoardId,
          destColumnId: null,
          destIndex: null,
          start,
          end,
          userId: currentUserId,
        };
        console.log(payload);

        const isCopy = ctrlPressed || srcBoardId !== destBoardId;
        if (isCopy) {
          // socket.copyCard(projectId, payload);
        } else {
          // socket.moveCard(projectId, payload);
        }
      } else if (isCalendar(srcBoardType) && !isCalendar(destBoardType)) {
        const destColumnId =
          currentOverData?.columnId ??
          (currentOverData?.type === 'COLUMN' ? String(over.id) : null);

        const destItems = destColumnId ? getColumnCardIds(destColumnId) : [];
        const destIndex = findDropIndex(over, destItems);

        const payload = {
          cardId: String(active.id),
          srcBoardId,
          destBoardId,
          destColumnId,
          destIndex,
          userId: currentUserId,
        };

        const isCopy = ctrlPressed || srcBoardId !== destBoardId;
        if (isCopy) {
          socket.copyCard(projectId, payload);
        } else {
          socket.moveCard(projectId, payload);
        }
      } else {
        const destColumnId =
          currentOverData?.columnId ??
          (currentOverData?.type === 'COLUMN' ? String(over.id) : srcColumnId);

        const destItems = getColumnCardIds(destColumnId);
        const destIndex = findDropIndex(over, destItems);

        const isCopy = ctrlPressed || srcBoardId !== destBoardId;

        const payload = {
          cardId: String(active.id),
          srcBoardId,
          destBoardId,
          srcColumnId,
          destColumnId,
          destIndex,
          userId: currentUserId,
        };

        if (isCopy) {
          socket.copyCard(projectId, payload);
        } else {
          socket.moveCard(projectId, payload);
        }
      }
    }

    setActiveId(null);
    setOverId(null);
    setActiveItem(null);
    setOverData(null);
  };


  const { cards, columns } = projectStore.getState();

  const overlay = useMemo(() => {
    if (!activeId || !activeItem) return null;

    if (activeItem.type === 'CARD' && cards[activeId]) {
      return (
        <Card
          card={cards[activeId]}
          columnId={activeItem.columnId}
          boardId={activeItem.boardId}
          boardType={activeItem.boardType}
          index={activeItem.index}
          isOverlay
        />
      );
    }

    if (activeItem.type === 'COLUMN' && columns[activeId]) {
      return (
        <Column
          column={columns[activeId]}
          boardId={activeItem.boardId}
          boardType={activeItem.boardType}
          index={activeItem.index}
          isOverlay
        />
      );
    }

    return null;
  }, [activeId, activeItem, cards, columns]);

  const contextValue = useMemo(
    () => ({
      activeId,
      overId,
      activeItem,
      registerScrollContainer,
      registerBoardScrollContainer,
      overData,
      setOverData,
    }),
    [
      activeId,
      activeItem,
      overId,
      overData,
      registerScrollContainer,
      registerBoardScrollContainer,
      setOverData,
    ]
  );

  return (
    <DragContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        autoScroll={{
          enabled: true,
          threshold: { x: 0.15, y: 0.15 },
          acceleration: 20,
          // interval: 10,
        }}
      >
        {/* ✅ Hook useDndMonitor giờ nằm đúng vị trí */}
        <DndMonitor
          columnScrollContainers={columnScrollContainers}
          boardScrollContainers={boardScrollContainers}
          activeItem={activeItem}
          overData={overData}
        />

        {children}

        <DragOverlay adjustScale={false} dropAnimation={null}>
          {overlay}
        </DragOverlay>
      </DndContext>
    </DragContext.Provider>
  );
}
