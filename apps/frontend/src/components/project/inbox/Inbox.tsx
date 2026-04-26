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

  const isDark = theme === 'dark';

  return (
    <div
      ref={setNodeRef}
      className={`
        select-none h-full flex flex-col overflow-hidden
        ${isDark ? 'bg-[#141517]' : 'bg-white'}
        ${className ?? ''}
      `}
    >
      {/* Inbox Header */}
      <div className={`
        flex items-center justify-between px-4 h-12 border-b shrink-0 transition-colors duration-200
        ${isDark ? 'border-white/5 bg-[#1e1f22]' : 'border-gray-200 bg-white'}
      `}>
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}
          `}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
          </div>
          <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
            Inbox
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className={`
             px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
             ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}
           `}>
            {sortedColumns.length} Blocks
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50/30 dark:bg-black/10 pt-2">
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
    </div>
  );
}
