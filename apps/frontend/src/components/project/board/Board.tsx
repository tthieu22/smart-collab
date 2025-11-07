// Board.tsx
'use client';

import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import Column from './Column';
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

  return (
    <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
      <SortableContext
        items={columnIds}
        strategy={horizontalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className="flex h-full gap-4 p-4 overflow-x-auto scrollbar-thin"
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

          {/* Board placeholder */}
          {isOver && isDraggingCard && (
            <div className="w-72 h-32 flex-shrink-0 rounded-xl border-2 border-dashed border-blue-500 bg-blue-50/70 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium">
              Thả để tạo cột mới
            </div>
          )}

          <div className="w-72 flex-shrink-0" />
        </div>
      </SortableContext>
    </div>
  );
}
