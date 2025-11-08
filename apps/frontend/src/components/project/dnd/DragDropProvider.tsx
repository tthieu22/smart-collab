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
      return idx === -1 ? items.length : idx + 1;
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
    if (!over || !currentProject?.id || !activeItem) {
      setActiveId(null);
      setOverId(null);
      setActiveItem(null);
      setOverData(null);
      return;
    }

    const ctrlPressed =
      (event.activatorEvent as MouseEvent)?.ctrlKey ||
      (event.activatorEvent as MouseEvent)?.metaKey;

    const overData = over.data.current || {};
    const projectId = currentProject.id;

    if (activeItem.type === 'COLUMN') {
      const srcBoardId = activeItem.boardId;
      const destBoardId = overData.boardId ?? srcBoardId;
      const columnId = String(active.id);

      // Chỉ cho phép di chuyển column trong cùng board type 'board'
      if (
        boardTypes[srcBoardId] === 'board' &&
        boardTypes[destBoardId] === 'board' &&
        srcBoardId === destBoardId
      ) {
        // Tính toán destIndex dựa trên vị trí của over element
        const state = projectStore.getState();
        const columnIds = state.boardColumns[destBoardId] || [];
        const activeIndex = columnIds.indexOf(columnId);

        // Nếu không tìm thấy activeIndex, không làm gì
        if (activeIndex === -1) {
          setActiveId(null);
          setOverId(null);
          setActiveItem(null);
          setOverData(null);
          return;
        }

        let destIndex = activeIndex; // Mặc định giữ nguyên vị trí

        if (overData.type === 'COLUMN' && over.id !== active.id) {
          // Đang kéo qua một column khác
          const overIndex = columnIds.indexOf(String(over.id));

          if (overIndex !== -1) {
            // Với horizontalListSortingStrategy, @dnd-kit sẽ tự động xử lý insert trước/sau
            // Sử dụng overIndex làm điểm đích, arrayMove sẽ tự động tính toán index chính xác
            // Store sẽ sử dụng arrayMove với destIndex = overIndex
            destIndex = overIndex;
          }
        }

        // Chỉ di chuyển nếu index thay đổi
        if (destIndex !== activeIndex) {
          // Gọi moveColumn trong store để cập nhật state (store sẽ tự động cập nhật position)
          projectStore
            .getState()
            .moveColumn(srcBoardId, destBoardId, columnId, destIndex);

          // socket.moveColumn(projectId, srcBoardId, destBoardId, columnId, destIndex);
        }
      }

      setActiveId(null);
      setOverId(null);
      setActiveItem(null);
      setOverData(null);
      return;
    }

    if (activeItem.type === 'CARD') {
      const srcBoardId = activeItem.boardId;
      const destBoardId = overData.boardId ?? srcBoardId;
      const srcColumnId = activeItem.columnId;
      const destColumnId =
        overData.columnId ||
        (overData.type === 'COLUMN' ? String(over.id) : srcColumnId);

      const destItems = getColumnCardIds(destColumnId);
      const destIndex = findDropIndex(over, destItems);

      const srcType = boardTypes[srcBoardId];
      const destType = boardTypes[destBoardId];
      const isCopy = ctrlPressed || srcType !== destType;

      if (isCopy) {
        // socket.copyCard(projectId, String(active.id));
      } else {
        // socket.moveCard(projectId, String(active.id), destColumnId, destIndex);
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
    }),
    [
      activeId,
      activeItem,
      overId,
      overData,
      registerScrollContainer,
      registerBoardScrollContainer,
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
