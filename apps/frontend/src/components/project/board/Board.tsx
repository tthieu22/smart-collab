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
import { useBoardStore } from '@smart/store/setting';

interface Props {
  board: BoardType;
}

export default function Board({ board }: Props) {
  const { activeItem, registerBoardScrollContainer } = useDragContext();
  const { boardColumns, columns, currentProject } = projectStore();
  const theme = useBoardStore((s) => s.theme);

  const columnIds = boardColumns[board.id] || [];

  const sortedColumns = useMemo(
    () =>
      columnIds
        .map((id) => columns[id])
        .filter(Boolean)
        .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0)),
    [columnIds, columns]
  );

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
    <div
      className={`relative overflow-hidden rounded-2xl transition-all duration-300 h-full backdrop-blur-sm ${
        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
      }`}
      style={{
        backgroundColor:
          theme === 'dark'
            ? currentProject?.color ?? '#1e1f22'
            : currentProject?.color ?? '#f4f5f7',
        backgroundImage:
          currentProject?.fileUrl || currentProject?.background
            ? `url(${currentProject.fileUrl ?? currentProject.background})`
            : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ...(theme === 'dark' && {
          backgroundBlendMode: 'normal',
          filter: 'brightness(0.9)',
        }),
      }}
    >
      <div
        ref={setBoardRef}
        id="board"
        className="
          flex flex-grow-0 gap-4
          overflow-x-auto overflow-y-auto
          h-full
        "
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
