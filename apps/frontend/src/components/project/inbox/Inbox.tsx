'use client';

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Board as BoardType, Column as ColumnType } from '@smart/types/project';
import { projectStore } from '@smart/store/project';
import { useBoardStore } from '@smart/store/setting';
import ColumnInbox from './ColumnInbox';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useDragContext } from '../dnd/DragContext';
import { AddCard } from '../AddCard';

interface InboxProps {
  board: BoardType;
  className?: string;
}

export default function Inbox({ board, className }: InboxProps) {
  const { registerBoardScrollContainer } = useDragContext();
  const { boardColumns, columns, currentProject } = projectStore();
  const theme = useBoardStore((s) => s.theme);

  if (!board)
    return <div className="p-4 text-center text-red-600">Không tìm thấy Inbox</div>;

  const projectId = currentProject?.id;
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
      ref={setInboxRef}
      className={`relative flex-1 min-h-full select-none ${className ?? ''}`}
      style={{ backgroundColor: theme === 'dark' ? '#000' : '#f9fafb' }}
    >
      <SortableContext items={sortedColumnIds} strategy={horizontalListSortingStrategy}>
        <div className="flex space-x-4">
          {sortedColumns.map((col, index) => (
            <section key={col.id} className="flex flex-col w-[300px]">
              {/* Tiêu đề cột */}
              <header className="p-2 font-bold text-lg border-b border-gray-300 dark:border-gray-700">
                {col.title}
              </header>

              {/* Card và drag/drop */}
              <ColumnInbox
                column={col}
                boardId={board.id}
                boardType={board.type}
                index={index}
              />

              {/* Nút thêm card */}
              {projectId && (
                <footer className="p-2 border-b border-gray-200 dark:border-gray-800">
                  <AddCard projectId={projectId} columnId={col.id} />
                </footer>
              )}
            </section>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
