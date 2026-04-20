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
import InviteMemberModal from '../member/InviteMemberModal';
import { useState } from 'react';
import { Tooltip, Segmented } from 'antd';
import { LayoutOutlined, CalendarOutlined, TableOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
import CalendarView from '@smart/components/project/calendar/CalendarView';
import TableView from '@smart/components/project/table/TableView';
import TimelineView from '@smart/components/project/timeline/TimelineView';
import DashboardView from '@smart/components/project/dashboard/DashboardView';

interface Props {
  board: BoardType;
}

export default function Board({ board }: Props) {
  const { activeItem, registerBoardScrollContainer } = useDragContext();
  const { boardColumns, columns, currentProject } = projectStore();
  const theme = useBoardStore((s) => s.theme);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'calendar' | 'table' | 'timeline' | 'dashboard'>('board');

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
      className={`relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 h-full ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`}
      style={{
        backgroundColor:
          (board as any).color ||
          currentProject?.color ||
          (theme === 'dark' ? '#1e1f22' : '#f4f5f7'),
        backgroundImage:
          (board as any).fileUrl || (board as any).background || currentProject?.fileUrl || currentProject?.background
            ? `url(${(board as any).fileUrl || (board as any).background || currentProject?.fileUrl || currentProject?.background})`
            : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ...(theme === 'dark' && {
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(0,0,0,0.6)',
        }),
      }}
    >
      {/* ===== TRELLO STYLE PROJECT HEADER (Inside Board) ===== */}
      <div className="flex-none px-4 py-3 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-4">
          <h1 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {currentProject?.name}
          </h1>
          <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-300'}`} />
          <div className="flex -space-x-2 overflow-hidden">
            {currentProject?.members?.slice(0, 5).map((member) => {
              const name = (member.user?.firstName && member.user.firstName !== 'User')
                ? member.user.firstName
                : member.user?.email || 'User';
              const email = member.user?.email;
              const initial = name.charAt(0).toUpperCase();
              return (
                <Tooltip key={member.id} title={email ? `${name} (${email}) ${member.status === 'PENDING' ? '[Chờ xác nhận]' : ''}` : name}>
                  <div
                    className={`w-7 h-7 rounded-full bg-blue-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm cursor-pointer hover:z-10 transition-transform hover:scale-110 ${member.status === 'PENDING' ? 'opacity-40 grayscale-[0.5]' : ''}`}
                  >
                    {member.user?.avatar ? (
                      <img
                        src={member.user.avatar}
                        alt={name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>
                </Tooltip>
              );
            })}
            {currentProject?.members && currentProject.members.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-gray-400 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm cursor-pointer hover:z-10">
                +{currentProject.members.length - 5}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as 'board' | 'calendar' | 'table' | 'timeline' | 'dashboard')}
            options={[
              { label: 'Board', value: 'board', icon: <LayoutOutlined /> },
              { label: 'Calendar', value: 'calendar', icon: <CalendarOutlined /> },
              { label: 'Table', value: 'table', icon: <TableOutlined /> },
              { label: 'Timeline', value: 'timeline', icon: <LineChartOutlined /> },
              { label: 'Dashboard', value: 'dashboard', icon: <PieChartOutlined /> },
            ]}
            className={`
              ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-100'} 
              rounded-md overflow-hidden
            `}
          />
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="
              flex items-center gap-1.5 px-3 py-1.5 
              bg-gray-100 hover:bg-gray-200 
              dark:bg-white/10 dark:hover:bg-white/20 
              backdrop-blur-md 
              text-gray-800 dark:text-white 
              rounded-md text-xs font-semibold 
              transition-all active:scale-95 
              border border-gray-200 dark:border-white/10
            "
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Thêm thành viên
          </button>
        </div>
      </div>

      {/* Board Content */}
      {viewMode === 'board' ? (
        <div
          ref={setBoardRef}
          id="board"
          className="
            flex flex-1 gap-4 p-4 pt-0
            overflow-x-auto overflow-y-hidden
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
      ) : viewMode === 'calendar' ? (
        <CalendarView board={board} />
      ) : viewMode === 'table' ? (
        <TableView board={board} />
      ) : viewMode === 'timeline' ? (
        <TimelineView board={board} />
      ) : (
        <DashboardView board={board} />
      )}

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        project={currentProject!}
      />
    </div>
  );
}
