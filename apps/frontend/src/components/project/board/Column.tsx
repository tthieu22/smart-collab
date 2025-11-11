// Column.tsx
'use client';

import React, { Fragment, useEffect, useRef } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './Card';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import { Column as ColumnType } from '@smart/types/project';
import { useDragContext } from '../dnd/DragContext';
import { useDroppable } from '@dnd-kit/core';
import { AddCard } from '../AddCard';

interface Props {
  column: ColumnType;
  boardId: string;
  boardType: string;
  index: number;
  isOverlay?: boolean;
}

export default function Column({
  column,
  boardId,
  boardType,
  index,
  isOverlay,
}: Props) {
  const { activeItem, registerScrollContainer, overData, overId } =
    useDragContext();
  const { cards, columnCards, currentProject } = projectStore();
  const cardIds = columnCards[column.id] || [];
  const projectId = currentProject?.id;
  if (!projectId) {
    return (
      <div className="w-72 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center text-sm">
        Không tìm thấy Project ID
      </div>
    );
  }

  const isDraggingColumn = activeItem?.type === 'COLUMN';

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'COLUMN', boardId, boardType, columnId: column.id, index },
    disabled: boardType !== 'board',
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'COLUMN', columnId: column.id, boardId, boardType },
  });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOverlay) return;
    registerScrollContainer?.(column.id, scrollContainerRef.current);
    return () => {
      registerScrollContainer?.(column.id, null);
    };
  }, [column.id, isOverlay, registerScrollContainer]);

  // Merge sortable và droppable refs - sortable ref cho drag handle, droppable ref cho drop zone
  const setRef = (node: HTMLElement | null) => {
    if (!node) {
      setSortableRef(null);
      setDroppableRef(null);
      return;
    }
    // Set sortable ref cho toàn bộ column element
    setSortableRef(node);
    // Set droppable ref cho toàn bộ column element (cùng node)
    setDroppableRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDraggingCard = activeItem?.type === 'CARD';
  const showPlaceholder =
    isDraggingCard &&
    !isOverlay &&
    ((isOver && overData?.type !== 'CARD') ||
      (overData?.type === 'COLUMN' && overData.columnId === column.id) ||
      (overData?.type === 'BOARD' &&
        overData.boardId === boardId &&
        cardIds.length === 0));

  const shouldShowBeforeCard = (cardId: string) => {
    if (!isDraggingCard || isOverlay) return false;
    if (!overData || overData?.type !== 'CARD') return false;
    if (overData.columnId !== column.id) return false;
    return String(overId) === String(cardId);
  };

  const DropIndicator = () => (
    <div className="h-28 rounded-xl border-2 border-dashed border-blue-400/80 bg-blue-500/15 dark:bg-blue-400/10 animate-pulse pointer-events-none backdrop-blur-sm ring-1 ring-blue-400/50">
      <div className="h-4 bg-blue-300/60 dark:bg-blue-300/50 rounded w-3/4 mt-3 mx-3" />
      <div className="h-3 bg-blue-200/50 dark:bg-blue-200/40 rounded w-1/2 mt-2 mx-3" />
    </div>
  );

  useEffect(() => {
    if (cardIds.length === 0 && !isOverlay) {
      projectService.getCardByColumn(column.id).then((res: any) => {
        if (res.success) {
          projectStore.getState().addCard(column.id, res.data);
        }
      });
    }
  }, [column.id, cardIds.length, isOverlay]);
  return (
    <div
      ref={setRef}
      style={style}
      data-testid="list-wrapper"
      className="flex-shrink-0 will-change-transform"
    >
      {/* COLUMN – GLASS + NEON + DARK MODE */}
      <div
        className="
        flex flex-col relative box-border
        basis-[272px] grow-0 shrink-0 self-start
        justify-between w-[272px] max-h-[70vh]
        pb-1 rounded-xl
        bg-white/25 dark:bg-black/25
        backdrop-blur-md
        border border-white/30 dark:border-white/10
        shadow-2xl
        ring-1 ring-white/30 dark:ring-white/20
        hover:ring-blue-400/60 dark:hover:ring-blue-300/50
        hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] dark:hover:shadow-[0_0_20px_rgba(147,197,253,0.3)]
        transition-all duration-300 ease-out
        scroll-m-2
        group
      "
        data-testid="list"
      >
        {/* Header – Neon Title - Drag Handle */}
        <div 
          className="p-3 cursor-grab active:cursor-grabbing select-none" 
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
        >
          <h3 className="font-bold text-lg flex items-center justify-between">
            <span>{column.title}</span>
            <span>
              {cardIds.length}
            </span>
          </h3>
        </div>

        {/* Scrollable Cards */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin scrollbar-thumb-white/30 dark:scrollbar-thumb-white/20"
        >
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
            disabled={isDraggingColumn}
          >
            <ol className="space-y-2 min-h-[60px]">
              {cardIds.map((cardId, idx) => {
                const card = cards[cardId];
                if (!card) return null;
                const insertBefore = shouldShowBeforeCard(cardId);
                return (
                  <Fragment key={cardId}>
                    {insertBefore && <DropIndicator />}
                    <Card
                      card={card}
                      columnId={column.id}
                      boardId={boardId}
                      boardType={boardType}
                      index={idx}
                    />
                  </Fragment>
                );
              })}

              {showPlaceholder && <DropIndicator />}
            </ol>
          </SortableContext>
        </div>

        {/* Footer */}
        <div className="p-3 pt-0">
          <AddCard projectId={projectId} columnId={column.id} />
        </div>
      </div>

      {/* OVERLAY KHI KÉO – NEON PULSE */}
      {isOverlay && (
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            transform:
              style?.transform?.replace(/,\s*0px\)/, ', 0px)') ?? undefined,
          }}
        >
          <div
            className="
            w-[272px] h-full
            bg-white/60 dark:bg-black/50
            backdrop-blur-xl
            rounded-xl
            shadow-2xl
            border-2 border-blue-400
            ring-4 ring-blue-400/60
            flex flex-col p-3
            [box-shadow:0_0_30px_rgba(59,130,246,0.6)] dark:[box-shadow:0_0_30px_rgba(147,197,253,0.5)]
          "
          >
            <h3 className="font-extrabold text-xl">
              {column.title}
              <span className="block text-xs mt-1 opacity-90">
                ({cardIds.length} cards)
              </span>
            </h3>
            <div className="flex-1 mt-4 bg-gradient-to-b from-blue-300/30 via-transparent to-purple-300/20 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
