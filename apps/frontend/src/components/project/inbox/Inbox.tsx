'use client';
import React from 'react';
import { Board as BoardType, Column as ColumnType } from '@smart/types/project';
import { projectStore } from '@smart/store/project';
import { useBoardStore } from '@smart/store/setting';
import Column from '../board/Column';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

interface InboxProps {
  board: BoardType;
  className?: string;
}

export default function Inbox({ board, className }: InboxProps) {
  const columnsStore = projectStore((s) => s.columns);
  const currentProject = projectStore((s) => s.currentProject);
  const theme = useBoardStore((s) => s.theme);

  if (!currentProject) return <div>Không có dự án</div>;
  if (!board) return <div>Không tìm thấy Inbox</div>;

  const columns: ColumnType[] = (board.columnIds ?? [])
    .map((id) => columnsStore[id])
    .filter((col): col is ColumnType => Boolean(col))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div
      data-board-scroll
      className={`flex gap-4 overflow-x-auto p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm w-full ${
        className ?? ''
      } ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-[#1e1f22] to-[#2b2d31] text-gray-100'
          : 'bg-gradient-to-br from-[#f4f5f7] to-[#e9ebee] text-gray-900'
      }`}
      style={{
        backgroundColor:
          theme === 'dark'
            ? currentProject.color ?? '#1e1f22'
            : currentProject.color ?? '#f4f5f7',
        backgroundImage:
          currentProject.fileUrl || currentProject.background
            ? `url(${currentProject.fileUrl ?? currentProject.background})`
            : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '300px',
        ...(theme === 'dark' && {
          backgroundBlendMode: 'normal',
          filter: 'brightness(0.9)',
        }),
      }}
    >
      <SortableContext
        id={board.id}
        items={columns.map((c) => c.id)}
        strategy={horizontalListSortingStrategy}
      >
        {columns.map((col) => (
          <div key={col.id}>
            {/* <Column column={col} /> */}
          </div>
        ))}
      </SortableContext>
    </div>
  );
}
