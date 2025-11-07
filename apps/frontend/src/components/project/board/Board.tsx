'use client';

import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import Column from './Column';
import AddColumn from '../AddColumn'; // Import AddColumn
import { projectStore } from '@smart/store/project';
import { Board as BoardType } from '@smart/types/project';
import { useMemo } from 'react';
import { useDragContext } from '../dnd/DragDropProvider';

interface Props {
  board: BoardType;
}

export default function Board({ board }: Props) {
  const { activeItem } = useDragContext();
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

  const { setNodeRef, isOver } = useDroppable({
    id: `board-${board.id}`,
    data: { type: 'BOARD', boardId: board.id },
  });

  const isDraggingCard = activeItem?.type === 'CARD';
  const canAddColumn = board.type === 'board'; // Điều kiện chỉ cho type = board

  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50/80 to-gray-100/50 dark:from-gray-900/90 dark:to-black/80">
      <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
        <div
          ref={setNodeRef}
          id="board"
          className="
            absolute inset-x-0 top-2 bottom-0
            flex gap-4 px-4 py-3
            overflow-x-auto overflow-y-hidden
            scrollbar-thin
            scrollbar-thumb-white/30 dark:scrollbar-thumb-white/20
            scrollbar-track-transparent
            scroll-smooth
            snap-x
            [scrollbar-gutter:stable]
          "
        >
          {/* CÁC CỘT */}
          {sortedColumns.map((col, index) => (
            <Column
              key={col.id}
              column={col}
              boardId={board.id}
              boardType={board.type}
              index={index}
            />
          ))}

          {/* NÚT THÊM CỘT - CHỈ HIỆN KHI type = 'board' */}
          {canAddColumn && <AddColumn boardId={board.id} />}

          {/* PLACEHOLDER KHI KÉO THẢ CARD */}
          {isOver && isDraggingCard && (
            <div className="
              w-72 h-full min-h-[500px] flex-shrink-0
              rounded-xl border-3 border-dashed border-blue-400/80
              bg-gradient-to-br from-blue-500/10 to-purple-500/10
              dark:from-blue-400/10 dark:to-purple-400/10
              backdrop-blur-md ring-2 ring-blue-400/50
              flex flex-col items-center justify-center
              text-blue-600 dark:text-blue-300 font-semibold text-lg
              animate-pulse shadow-2xl
            ">
              <svg className="w-12 h-12 mb-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thả để tạo cột mới
            </div>
          )}

          {/* SPACER CUỐI */}
          <div className="w-72 flex-shrink-0 pointer-events-none" aria-hidden="true" />
        </div>
      </SortableContext>
    </div>
  );
}