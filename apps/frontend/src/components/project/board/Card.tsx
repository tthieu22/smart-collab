// Card.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType } from '@smart/types/project';
import { useDragContext } from '../dnd/DragDropProvider';

interface Props {
  card: CardType;
  columnId: string;
  boardId: string;
  boardType: string;
  index: number;
  isOverlay?: boolean;
}

export function Card({
  card,
  columnId,
  boardId,
  boardType,
  index,
  isOverlay,
}: Props) {
  const { activeId } = useDragContext();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'CARD', boardId, boardType, columnId, index },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 
        p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none
        ${isOverlay ? 'shadow-2xl border-blue-400' : ''}
        ${isDragging ? 'rotate-3' : ''}
      `}
    >
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {card.title}
      </div>
      {card.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {card.description}
        </p>
      )}
    </div>
  );
}
