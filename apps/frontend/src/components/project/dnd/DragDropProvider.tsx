// app/components/project/board/dnd/DragDropProvider.tsx
'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
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

interface Props {
  children: React.ReactNode;
  boardTypes?: Record<string, 'board' | 'inbox' | 'calendar'>;
}

interface DragContextType {
  activeId: UniqueIdentifier | null;
  overId: UniqueIdentifier | null;
  activeItem: any;
}

const DragContext = createContext<DragContextType>({
  activeId: null,
  overId: null,
  activeItem: null,
});
export const useDragContext = () => useContext(DragContext);

export default function DragDropProvider({ children, boardTypes = {} }: Props) {
  const { currentProject } = projectStore();
  const socket = getProjectSocketManager();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);

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
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !currentProject?.id || !activeItem) return;

    const ctrlPressed =
      (event.activatorEvent as MouseEvent)?.ctrlKey ||
      (event.activatorEvent as MouseEvent)?.metaKey;

    const overData = over.data.current || {};
    const projectId = currentProject.id;

    setActiveId(null);
    setOverId(null);
    setActiveItem(null);

    if (activeItem.type === 'COLUMN') {
      const srcBoardId = activeItem.boardId;
      const destBoardId = overData.boardId ?? srcBoardId;
      const destIndex = overData.index ?? 0;

      if (
        boardTypes[srcBoardId] === 'board' &&
        boardTypes[destBoardId] === 'board'
      ) {
        // socket.moveColumn(
        //   projectId,
        //   srcBoardId,
        //   destBoardId,
        //   String(active.id),
        //   destIndex
        // );
      }
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
  };

  const { cards, columns } = projectStore.getState();

  const overlay = useMemo(() => {
    if (!activeId || !activeItem) return null;

    return (
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2">
          {activeItem.type === 'CARD' && cards[activeId] && (
            <div className="scale-105 shadow-2xl rounded-lg">
              <Card
                card={cards[activeId]}
                columnId={activeItem.columnId}
                boardId={activeItem.boardId}
                boardType={activeItem.boardType}
                index={activeItem.index}
                isOverlay
              />
            </div>
          )}
          {activeItem.type === 'COLUMN' && columns[activeId] && (
            <div className="scale-105 shadow-2xl rounded-xl rotate-3">
              <Column
                column={columns[activeId]}
                boardId={activeItem.boardId}
                boardType={activeItem.boardType}
                index={activeItem.index}
                isOverlay
              />
            </div>
          )}
        </div>
      </div>
    );
  }, [activeId, activeItem, cards, columns]);

  return (
    <DragContext.Provider value={{ activeId, overId, activeItem }}>
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
          interval: 10,
        }}
      >
        {children}
        <DragOverlay adjustScale={false} dropAnimation={null}>
          {overlay}
        </DragOverlay>
      </DndContext>
    </DragContext.Provider>
  );
}
