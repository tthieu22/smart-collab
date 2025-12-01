'use client';

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Board as BoardType, Column as ColumnType } from '@smart/types/project';
import { projectStore } from '@smart/store/project';
import { useBoardStore } from '@smart/store/setting';
import Column from '../board/Column';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useDragContext } from '../dnd/DragContext';

interface InboxProps {
  board: BoardType;
  className?: string;
}

export default function Inbox({ board, className }: InboxProps) {
  const { registerBoardScrollContainer } = useDragContext();
  const { boardColumns, columns } = projectStore();
  const theme = useBoardStore((s) => s.theme);

  if (!board) return <div className="p-4 text-center text-red-600">Không tìm thấy Inbox</div>;

  const columnIds = boardColumns[board.id] || [];

  const sortedColumns: ColumnType[] = useMemo(() => {
    return columnIds
      .map((id) => columns[id])
      .filter((col): col is ColumnType => Boolean(col))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [columnIds, columns]);

  const sortedColumnIds = useMemo(() => sortedColumns.map((c) => c.id), [sortedColumns]);

  const { setNodeRef } = useDroppable({
    id: `inbox-${board.id}`,
    data: { type: 'INBOX', boardId: board.id },
  });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerBoardScrollContainer?.(board.id, scrollContainerRef.current);
    return () => registerBoardScrollContainer?.(board.id, null);
  }, [board.id, registerBoardScrollContainer]);

  const setInboxRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollContainerRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  return (
    <div
      className={`relative flex-1 overflow-hidden min-h-full ${
        className ?? ''
      }`}
      style={{
        backgroundColor: theme === 'dark' ? '#000' : '#f9fafb',
      }}
    >
      <div
        ref={setInboxRef}
        className="
          flex gap-6
          flex-nowrap
          overflow-hidden
          rounded-lg
          h-full
          select-none
          justify-center items-center
        "
        style={{
          WebkitOverflowScrolling: 'touch',
          transform: 'translateZ(0)',
          scrollBehavior: 'smooth',
        }}
      >
        <SortableContext items={sortedColumnIds} strategy={horizontalListSortingStrategy}>
          {sortedColumns.map((col, index) => (
            <Column
              key={col.id}
              column={col}
              boardId={board.id}
              boardType={board.type}
              index={index}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
