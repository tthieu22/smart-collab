'use client';

import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import Column from './Column';
import AddColumn from '../AddColumn';
import { projectStore } from '@smart/store/project';
import { Board as BoardType } from '@smart/types/project';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useDragContext } from '../dnd/DragContext';

interface Props {
  board: BoardType;
}

export default function Board({ board }: Props) {
  const { activeItem, registerBoardScrollContainer } = useDragContext();
  const { boardColumns, columns } = projectStore();
  const columnIds = boardColumns[board.id] || [];

  const sortedColumns = useMemo(
    () =>
      columnIds
        .map((id) => columns[id])
        .filter(Boolean)
        .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0)),
    [columnIds, columns]
  );

  // Đảm bảo columnIds trong SortableContext match với sortedColumns
  const sortedColumnIds = useMemo(
    () => sortedColumns.map((col) => col.id),
    [sortedColumns]
  );

  const { setNodeRef, isOver } = useDroppable({
    id: `board-${board.id}`,
    data: { type: 'BOARD', boardId: board.id },
  });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerBoardScrollContainer?.(board.id, scrollContainerRef.current);
    return () => registerBoardScrollContainer?.(board.id, null);
  }, [board.id, registerBoardScrollContainer]);

  const setBoardRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollContainerRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  const isDraggingCard = activeItem?.type === 'CARD';
  const canAddColumn = board.type === 'board';

  return (
    <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-gray-50/80 to-gray-100/50 dark:from-gray-900/90 dark:to-black/80">
      <div
        ref={setBoardRef}
        id="board"
        className="
          flex gap-4 px-4 py-3
          overflow-x-auto overflow-y-hidden
          scrollbar-thin
          scrollbar-thumb-white/30 dark:scrollbar-thumb-white/20
          scrollbar-track-transparent
          scroll-smooth
          snap-x
          [scrollbar-gutter:stable]
          h-screen
          min-h-[500px]
        "
        style={{
          WebkitOverflowScrolling: 'touch',
          transform: 'translateZ(0)',
          scrollBehavior: 'auto',
        }}
      >
        <SortableContext
          items={sortedColumnIds}
          strategy={horizontalListSortingStrategy}
        >
          {sortedColumns.map((col, index) => (
            <Column
              key={col.id}
              column={col}
              boardId={board.id}
              boardType={board.type}
              index={index}
            />
          ))}

          {isOver && isDraggingCard && (
            <div
              className="
                w-72 h-full min-h-[900px] flex-shrink-0
                rounded-xl border-3 border-dashed border-blue-400/80
                bg-gradient-to-br from-blue-500/10 to-purple-500/10
                dark:from-blue-400/10 dark:to-purple-400/10
                backdrop-blur-md ring-2 ring-blue-400/50
                flex flex-col items-center justify-center
                text-blue-600 dark:text-blue-300 font-semibold text-lg
                animate-pulse shadow-2xl
              "
            >
              <svg
                className="w-12 h-12 mb-3 opacity-70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Thả để tạo cột mới
            </div>
          )}

          {canAddColumn && <AddColumn boardId={board.id} />}

          <div
            className="w-4 flex-shrink-0 pointer-events-none"
            aria-hidden="true"
          />
        </SortableContext>
      </div>
    </div>
  );
}
