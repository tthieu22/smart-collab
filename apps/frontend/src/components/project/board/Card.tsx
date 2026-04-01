'use client';

import React, { useCallback, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType } from '@smart/types/project';
import { useDragContext } from '../dnd/DragContext';
import CardDetailModal from '../cardDetailModal/CardDetailModalById';

interface Props {
  card: CardType;
  columnId: string;
  boardId: string;
  boardType: string;
  index: number;
  isOverlay?: boolean;
}

export const Card = React.memo(function Card({
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
    data: { type: 'CARD', card, columnId, boardId, boardType, index },
    disabled: isOverlay,
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const style = useMemo(() => {
    const transformStr = CSS.Transform.toString(transform) || '';
    return {
      transform: isOverlay 
        ? `${transformStr} rotate(5deg)`.trim() 
        : transformStr,
      transition: transition || undefined,
    };
  }, [transform, transition, isOverlay]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeId || isOverlay) return;
      e.stopPropagation();
      setIsModalOpen(true);
    },
    [activeId, isOverlay]
  );

  // Khi đang kéo (không phải overlay) → ẩn hoàn toàn và co chiều cao về 0
  const isBeingDragged = isDragging && !isOverlay;

  return (
    <>
      <CardDetailModal
        cardId={card.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div
        ref={setNodeRef}
        id={card.id}
        data-card-id={card.id}
        data-column-id={columnId}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className={`
          ${isBeingDragged 
            ? 'h-0 p-0 m-0 overflow-hidden opacity-0 scale-95' 
            : 'my-1 p-3 h-auto'
          }
          transition-all duration-200 select-none
          bg-white dark:bg-gray-800 rounded-lg border
          ${isOverlay 
            ? 'border-blue-500 shadow-2xl ring-4 ring-blue-400/30 scale-105 cursor-grabbing' 
            : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg cursor-pointer'
          }
          ${!activeId && !isOverlay 
            ? 'hover:border-blue-400/50 hover:ring-2 hover:ring-blue-400/20' 
            : 'cursor-grab active:cursor-grabbing'
          }
        `}
      >
        {/* Nội dung chỉ hiện khi không bị ẩn */}
        <div className={isBeingDragged ? 'opacity-0' : 'opacity-100'}>
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            {card.title}
          </h4>
          {card.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">
              {card.description}
            </p>
          )}
        </div>
      </div>
    </>
  );
});

Card.displayName = 'Card';