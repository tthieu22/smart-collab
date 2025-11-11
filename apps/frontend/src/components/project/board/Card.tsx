// src/components/project/board/Card.tsx
'use client';

import React, { useState } from 'react';
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

export function Card({
  card,
  columnId,
  boardId,
  boardType,
  index,
  isOverlay,
}: Props) {
  const { activeId } = useDragContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // LOG: Click handler
  const handleClick = (e: React.MouseEvent) => {
    console.log('[Card] Click event', {
      cardId: card.id,
      activeId,
      isOverlay,
      isDragging,
      timestamp: new Date().toISOString(),
    });

    if (activeId) {
      console.log('[Card] BLOCKED: Có card đang kéo (activeId)', activeId);
      return;
    }

    if (isOverlay) {
      console.log('[Card] BLOCKED: Đây là overlay (isOverlay = true)');
      return;
    }

    e.stopPropagation();
    console.log('[Card] OPEN MODAL:', card.id);
    setIsModalOpen(true);
  };

  // LOG: Modal state change
  React.useEffect(() => {
    if (isModalOpen) {
      console.log('[Card] MODAL MỞ THÀNH CÔNG:', card.id);
    }
  }, [isModalOpen, card.id]);

  // LOG: Khi card được kéo
  React.useEffect(() => {
    if (isDragging) {
      console.log('[Card] CARD ĐANG KÉO:', card.id);
    }
  }, [isDragging, card.id]);

  return (
    <>
      {/* MODAL */}
      <CardDetailModal
        cardId={card.id}
        isOpen={isModalOpen}
        onClose={() => {
          console.log('[Card] Modal đóng');
          setIsModalOpen(false);
        }}
      />

      {/* CARD */}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className={`
          bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 
          p-3 shadow-sm transition-all select-none
          ${isOverlay ? 'shadow-2xl border-blue-400 ring-2 ring-blue-400/50' : ''}
          ${isDragging ? 'rotate-3 opacity-70' : ''}
          ${
            !activeId && !isOverlay
              ? 'hover:shadow-md hover:ring-2 hover:ring-blue-400/30 cursor-pointer'
              : 'cursor-grab active:cursor-grabbing'
          }
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
    </>
  );
}