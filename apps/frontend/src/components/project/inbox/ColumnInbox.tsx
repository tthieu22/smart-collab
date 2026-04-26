'use client';

import React, {
  Fragment,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../board/Card';
import { projectStore } from '@smart/store/project';
import { Column as ColumnType } from '@smart/types/project';
import { useDragContext } from '../dnd/DragContext';
import { useDroppable } from '@dnd-kit/core';
import { AddCard } from '../AddCard';
import { projectService } from '@smart/services/project.service';

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
  const loadedRef = useRef(false);

  useEffect(() => {
    // ❌ Không fetch ở overlay column
    if (isOverlay) return;

    // ❌ Không fetch khi đang kéo card
    if (activeItem?.type === 'CARD') return;

    // ❌ Đã load rồi thì thôi
    if (loadedRef.current) return;

    loadedRef.current = true;

    projectService.getCardByColumn(column.id).then((res: any) => {
      if (res.success && Array.isArray(res.data)) {
        projectStore.getState().addCard(column.id, res.data);
      }
    });
  }, [column.id, isOverlay, activeItem?.type]);

  const cards = projectStore((state) => state.cards);
  const columnCards = projectStore((state) => state.columnCards);
  const currentProject = projectStore((state) => state.currentProject);

  const cardIds = useMemo(
    () => Array.from(new Set(columnCards[column.id] || [])),
    [columnCards, column.id]
  );

  const projectId = currentProject?.id;
  if (!projectId) return null;

  const isDraggingColumn = activeItem?.type === 'COLUMN';

  /* ===================== */
  /* Sortable + Droppable */
  /* ===================== */

  const {
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'COLUMN', boardId, boardType, columnId: column.id, index },
    disabled: boardType !== 'board',
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
    data: { type: 'COLUMN', columnId: column.id, boardId, boardType },
  });

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      setSortableRef(node);
      setDroppableRef(node);
    },
    [setSortableRef, setDroppableRef]
  );

  /* ===================== */
  /* Scroll container */
  /* ===================== */

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOverlay) return;
    registerScrollContainer?.(column.id, scrollContainerRef.current);
    return () => registerScrollContainer?.(column.id, null);
  }, [column.id, isOverlay, registerScrollContainer]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /* ===================== */
  /* Trello-style overlay */
  /* ===================== */

  const ColumnPlaceholder = useMemo(
    () => (
      <div
        className="w-full h-full rounded-2xl border-2 border-dashed border-blue-400/50 bg-blue-500/5 dark:bg-blue-400/5 animate-pulse flex flex-col p-4 shadow-inner min-h-[200px]"
      >
        <div className="h-6 bg-blue-300/30 dark:bg-blue-300/20 rounded w-1/2 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-blue-200/20 dark:bg-blue-200/10 rounded-xl border border-blue-300/20" />
          ))}
        </div>
      </div>
    ),
    []
  );

  /* ===================== */
  /* Render */
  /* ===================== */

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setSortableRef}
        id={column.id}
        style={style}
        className="flex-shrink-0 w-full px-2"
      >
        {ColumnPlaceholder}
      </div>
    );
  }

  return (
    <div
      ref={setRef}
      id={column.id}
      data-column-id={column.id}
      style={{
        ...style,
        ...(isOverlay ? { cursor: 'grabbing' } : {})
      }}
      className={`
        flex flex-col h-full min-h-0 flex-shrink-0 transition-opacity duration-300
        ${isOverlay ? 'shadow-2xl ring-4 ring-blue-500/30 rotate-[2deg] scale-[1.05] z-[9999] opacity-90' : 'opacity-100'}
      `}
    >
      {/* Header */}
      <div className="shrink-0 p-3 pt-3">
        <AddCard projectId={projectId} columnId={column.id} />
      </div>

      {/* Scroll */}
      <div className="flex-1 min-h-0 relative">
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto px-2 pb-6 scrollbar-hide"
        >
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
            disabled={isDraggingColumn}
          >
            <ol className="space-y-2">
              {cardIds.map((cardId, idx) => {
                const card = cards[cardId];
                if (!card) return null;

                return (
                  <Card
                    key={cardId}
                    card={card}
                    columnId={column.id}
                    boardId={boardId}
                    boardType={boardType}
                    index={idx}
                  />
                );
              })}
            </ol>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
