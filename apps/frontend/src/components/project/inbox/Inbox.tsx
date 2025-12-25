'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Board as BoardType, Column as ColumnType } from '@smart/types/project';
import { projectStore } from '@smart/store/project';
import { useBoardStore } from '@smart/store/setting';
import ColumnInbox from './ColumnInbox';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface InboxProps {
  board: BoardType;
  className?: string;
}

export default function Inbox({ board, className }: InboxProps) {
  const { boardColumns, columns, currentProject } = projectStore();
  const theme = useBoardStore((s) => s.theme);

  if (!board) {
    return (
      <div className="p-4 text-center text-red-600">
        Không tìm thấy Inbox
      </div>
    );
  }

  const columnIds = boardColumns[board.id] || [];

  /** ✅ FIX sort: không mutate */
  const sortedColumns: ColumnType[] = useMemo(() => {
    return [...columnIds]
      .map((id) => columns[id])
      .filter((col): col is ColumnType => Boolean(col))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [columnIds, columns]);

  const sortedColumnIds = useMemo(
    () => sortedColumns.map((c) => c.id),
    [sortedColumns]
  );

  /** ✅ Droppable riêng, KHÔNG scroll */
  const { setNodeRef } = useDroppable({
    id: `inbox-${board.id}`,
    data: { type: 'INBOX', boardId: board.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`select-none h-full ${className ?? ''}`}
      style={{ backgroundColor: theme === 'dark' ? '#000' : '#f9fafb' }}
    >
      <SortableContext
        items={sortedColumnIds}
        strategy={horizontalListSortingStrategy}
      >
        {sortedColumns.map((col, index) => (
          <section
            className='h-full'
            key={col.id}
          >
            <ColumnInbox
              column={col}
              boardId={board.id}
              boardType={board.type}
              index={index}
            />
          </section>
        ))}
      </SortableContext>
    </div>
  );
}
