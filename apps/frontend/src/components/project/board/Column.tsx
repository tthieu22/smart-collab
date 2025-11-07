// Column.tsx
'use client';

import { useEffect } from 'react';
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
import { useDragContext } from '../dnd/DragDropProvider';
import { useDroppable } from '@dnd-kit/core';

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
  const { activeItem } = useDragContext();
  const { cards, columnCards } = projectStore();
  const cardIds = columnCards[column.id] || [];

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'COLUMN', boardId, boardType, index },
    disabled: boardType !== 'board',
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'COLUMN', columnId: column.id, boardId, boardType },
  });

  const setRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDraggingCard = activeItem?.type === 'CARD';
  const showPlaceholder = isOver && isDraggingCard && !isOverlay;

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
      {...attributes}
      {...listeners}
      className={`w-72 flex-shrink-0 bg-gray-100 dark:bg-red-100 rounded-xl ${
        isOverlay ? '' : 'shadow-md hover:shadow-lg'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Header */}
      <div className="p-3 cursor-grab active:cursor-grabbing select-none">
        <h3 className="font-semibold text-gray-800 dark:text-white flex items-center justify-between">
          {column.title}
          <span className="ml-2 text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
            {cardIds.length}
          </span>
        </h3>
      </div>

      {/* Card List - Scrollable */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 scrollbar-thin"
        // FIX: Tự động scroll khi kéo card đến đầu/cuối
        onMouseMove={(e) => {
          if (!activeItem || activeItem.type !== 'CARD') return;
          const el = e.currentTarget;
          const rect = el.getBoundingClientRect();
          const mouseY = e.clientY;
          const top = rect.top;
          const bottom = rect.bottom;
          const threshold = 60; // px

          if (mouseY < top + threshold) {
            el.scrollTop -= 15;
          } else if (mouseY > bottom - threshold) {
            el.scrollTop += 15;
          }
        }}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[60px]">
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

            {/* Placeholder khi thả */}
            {showPlaceholder && (
              <div className="h-24 rounded-lg border-2 border-dashed border-blue-500 bg-blue-50/80 dark:bg-blue-900/50 animate-pulse shadow-md" />
            )}
          </div>
        </SortableContext>
      </div>

      {/* Add card button area */}
      <div className="p-3 pt-0">
        <button className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          + Thêm card
        </button>
      </div>
    </div>
  );
}
