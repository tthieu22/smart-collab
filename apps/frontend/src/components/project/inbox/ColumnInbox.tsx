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
    () => columnCards[column.id] || [],
    [columnCards, column.id]
  );

  const projectId = currentProject?.id;
  if (!projectId) return null;

  const isDraggingColumn = activeItem?.type === 'COLUMN';
  const isDraggingCard = activeItem?.type === 'CARD';

  /* ===================== */
  /* Sortable + Droppable */
  /* ===================== */

  const { setNodeRef: setSortableRef, transform, transition } = useSortable({
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

  // ✅ Luôn lấy height ban đầu → không bị giật
  const overlayHeight =
    activeItem?.type === 'CARD'
      ? activeItem.rect?.current?.initial?.height ?? 96
      : 96;

  /**
   * overlayIndex CHỈ tính khi:
   * - đang kéo CARD
   * - over CARD cùng column
   * - dựa vào vị trí chuột (trên / dưới card)
   */
  const overlayIndex = useMemo(() => {
    if (!isDraggingCard || isOverlay) return null;
    if (!overData || overData.type !== 'CARD') return null;
    if (overData.columnId !== column.id) return null;

    const idx = cardIds.indexOf(String(overId));
    if (idx === -1) return null;

    const pointerY =
      (activeItem?.activatorEvent as MouseEvent | null)?.clientY ?? 0;

    const overRect = activeItem?.over?.rect;
    if (!overRect) return idx;

    const middleY = overRect.top + overRect.height / 2;

    // ✅ Trello logic
    return pointerY > middleY ? idx + 1 : idx;
  }, [
    isDraggingCard,
    isOverlay,
    overData,
    overId,
    cardIds,
    column.id,
    activeItem,
  ]);

  const InsertOverlay = ({ height }: { height: number }) => (
    <li
      className="rounded-xl border-2 border-dashed border-blue-400/80 bg-blue-500/15 animate-pulse pointer-events-none"
      style={{ height }}
    />
  );

  /* ===================== */
  /* Render */
  /* ===================== */

  return (
    <div
      ref={setRef}
      id={column.id}
      data-column-id={column.id}
      style={style}
      className="flex flex-col h-full min-h-0 flex-shrink-0"
    >
      {/* Header */}
      <div className="shrink-0 p-3 pt-0">
        <h3 className="text-sm font-semibold">Inbox</h3>
        <AddCard projectId={projectId} columnId={column.id} />
      </div>

      {/* Scroll */}
      <div className="flex-1 min-h-0">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto px-2 pb-6"
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
                  <Fragment key={cardId}>
                    {overlayIndex === idx && (
                      <InsertOverlay height={overlayHeight} />
                    )}

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

              {/* Overlay ở CUỐI */}
              {overlayIndex === cardIds.length && (
                <InsertOverlay height={overlayHeight} />
              )}
            </ol>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
