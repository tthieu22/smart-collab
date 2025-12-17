import React, { Fragment, useEffect, useRef, useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Card } from '../board/Card';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import { Column as ColumnType } from '@smart/types/project';
import { useDragContext } from '../dnd/DragContext';

interface Props {
  column: ColumnType;
  boardId: string;
  boardType: string;
  index: number;
}

export default function ColumnInbox({ column, boardId, boardType, index }: Props) {
  const { activeItem, registerScrollContainer, overData, overId } = useDragContext();

  const cards = projectStore((state) => state.cards);
  const columnCards = projectStore((state) => state.columnCards);
  const currentProject = projectStore((state) => state.currentProject);

  // Sắp xếp cards theo position để truyền đúng thứ tự cho SortableContext
  const cardIds = useMemo(() => {
    const cardsInColumn = columnCards[column.id] || [];
    // Lấy các card thật và sort theo position
    return cardsInColumn
      .map(id => cards[id])
      .filter(Boolean)
      .sort((a, b) => a.position - b.position)
      .map(card => card.id);
  }, [columnCards, column.id, cards]);

  const projectId = currentProject?.id;

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
    data: { type: 'COLUMN', columnId: column.id, boardId, boardType },
  });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerScrollContainer?.(column.id, scrollContainerRef.current);
    return () => {
      registerScrollContainer?.(column.id, null);
    };
  }, [column.id, registerScrollContainer]);

  const isDraggingCard = activeItem?.type === 'CARD';

  // Tính insertIndex dựa vào overData và overId
  const insertIndex = useMemo(() => {
    if (!isDraggingCard) return -1;
    if (!overData) return -1;

    if (overData.type === 'CARD' && overData.columnId === column.id) {
      const idx = cardIds.findIndex(id => String(id) === String(overId));
      return idx >= 0 ? idx : -1;
    }

    if (overData.type === 'COLUMN' && overData.columnId === column.id) {
      return cardIds.length;
    }

    return -1;
  }, [isDraggingCard, overData, overId, cardIds, column.id]);

  const DropIndicator = (
    <li
      className="h-16 rounded-xl border-2 border-dashed border-blue-400/80 bg-blue-500/15 dark:bg-blue-400/10 animate-pulse pointer-events-none backdrop-blur-sm ring-1 ring-blue-400/50"
      aria-hidden="true"
    />
  );

  useEffect(() => {
    if (cardIds.length === 0 && projectId) {
      projectService.getCardByColumn(column.id).then((res: any) => {
        if (res.success) {
          projectStore.getState().addCard(column.id, res.data);
        }
      });
    }
  }, [cardIds.length, column.id, projectId]);

  return (
    <div className="flex-shrink-0" style={{ width: '100%' }}>
      <div
        ref={(node) => {
          scrollContainerRef.current = node;
          setDroppableRef(node);
        }}
        className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-white/30 dark:scrollbar-thumb-white/20"
        style={{ maxHeight: 500 }}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2 min-h-[60px]">
            {cardIds.map((cardId, idx) => {
              const card = cards[cardId];
              if (!card) return null;

              return (
                <Fragment key={cardId}>
                  {idx === insertIndex && DropIndicator}
                  <Card
                    key={cardId}
                    card={card}
                    columnId={column.id}
                    boardId={boardId}
                    boardType={boardType}
                    index={idx}
                  />
                </Fragment>
              );
            })}
            {insertIndex === cardIds.length && DropIndicator}
          </ol>
        </SortableContext>
      </div>
    </div>
  );
}
