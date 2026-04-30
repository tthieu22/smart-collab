'use client';

import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import Column from './Column';
import AddColumn from '../AddColumn';
import { projectStore } from '@smart/store/project';
import { useUserStore } from '@smart/store/user';
import { Board as BoardType, Project } from '@smart/types/project';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useDragContext } from '../dnd/DragContext';
import { useBoardStore } from '@smart/store/setting';
import InviteMemberModal from '../member/InviteMemberModal';
import { useState } from 'react';
import { Tooltip, Input, Select, message } from 'antd';
import {
  LayoutOutlined,
  CalendarOutlined,
  TableOutlined,
  LineChartOutlined,
  PieChartOutlined,
  EnvironmentOutlined,
  DownOutlined,
  CheckOutlined,
  LockOutlined,
  GlobalOutlined,
  TeamOutlined,
  EditOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { projectService } from '@smart/services/project.service';
import dynamic from 'next/dynamic';

const CalendarView = dynamic(() => import('@smart/components/project/calendar/CalendarView'), { ssr: false });
const TableView = dynamic(() => import('@smart/components/project/table/TableView'), { ssr: false });
const TimelineView = dynamic(() => import('@smart/components/project/timeline/TimelineView'), { ssr: false });
const DashboardView = dynamic(() => import('@smart/components/project/dashboard/DashboardView'), { ssr: false });
const MapView = dynamic(() => import('@smart/components/project/map/MapView'), { ssr: false });
import { Dropdown, Button, MenuProps } from 'antd';

interface Props {
  board: BoardType;
}

export default function Board({ board }: Props) {
  const { activeItem, registerBoardScrollContainer } = useDragContext();
  const { boardColumns, columns, currentProject } = projectStore();
  const { currentUser } = useUserStore();
  const theme = useBoardStore((s) => s.theme);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'calendar' | 'table' | 'timeline' | 'dashboard' | 'map'>('board');

  const isOwner = currentUser?.id === currentProject?.ownerId;
  const isMember = currentProject?.members?.some(m => m.userId === currentUser?.id && m.status === 'ACCEPTED');
  const canEdit = isOwner || isMember;

  // Edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempName, setTempName] = useState(currentProject?.name || '');
  const [tempDesc, setTempDesc] = useState(currentProject?.description || '');

  useEffect(() => {
    if (currentProject) {
      setTempName(currentProject.name);
      setTempDesc(currentProject.description || '');
    }
  }, [currentProject]);

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!currentProject) return;
    try {
      await projectService.updateProject({
        projectId: currentProject.id,
        ...updates
      });
      // Store will be updated via realtime event
    } catch (error) {
      message.error('Cập nhật dự án thất bại');
    }
  };

  const onTitleBlur = () => {
    setIsEditingTitle(false);
    if (tempName !== currentProject?.name) {
      handleUpdateProject({ name: tempName });
    }
  };

  const onDescBlur = () => {
    setIsEditingDesc(false);
    if (tempDesc !== currentProject?.description) {
      handleUpdateProject({ description: tempDesc });
    }
  };

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

  const viewOptions = [
    { label: 'Board', value: 'board', icon: <LayoutOutlined /> },
    { label: 'Calendar', value: 'calendar', icon: <CalendarOutlined /> },
    { label: 'Table', value: 'table', icon: <TableOutlined /> },
    { label: 'Timeline', value: 'timeline', icon: <LineChartOutlined /> },
    { label: 'Dashboard', value: 'dashboard', icon: <PieChartOutlined /> },
    { label: 'Map', value: 'map', icon: <EnvironmentOutlined /> },
  ];

  const currentView = viewOptions.find(opt => opt.value === viewMode) || viewOptions[0];

  const menuItems: MenuProps['items'] = viewOptions.map(opt => ({
    key: opt.value,
    label: (
      <div className="flex items-center justify-between w-40 py-1">
        <div className="flex items-center gap-3">
          <span className="text-lg opacity-80">{opt.icon}</span>
          <span className="font-medium text-sm">{opt.label}</span>
        </div>
        {viewMode === opt.value && <CheckOutlined className="text-blue-500" />}
      </div>
    ),
    onClick: () => setViewMode(opt.value as any)
  }));

  return (
    <div
      className={`relative flex flex-col overflow-hidden transition-all duration-300 h-full font-sans ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        } ${viewMode === 'map' ? 'rounded-none' : 'rounded-2xl'}`}
      style={{
        backgroundColor:
          (board as any).color ||
          currentProject?.color ||
          (theme === 'dark' ? '#141517' : '#ffffff'),
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
      <div className={`
        flex-none px-4 h-12 flex items-center justify-between z-10 relative border-b
        ${theme === 'dark' ? 'bg-[#1e1f22] border-white/5' : 'bg-white border-gray-100'}
      `}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 group">
            {isEditingTitle && isOwner ? (
              <Input
                size="small"
                autoFocus
                className="font-bold text-lg w-auto min-w-[100px]"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={onTitleBlur}
                onPressEnter={onTitleBlur}
              />
            ) : (
              <h1 
                className={`text-lg font-bold tracking-tight px-1 rounded transition-colors ${isOwner ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/10' : ''} ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                onClick={() => isOwner && setIsEditingTitle(true)}
              >
                {currentProject?.name}
              </h1>
            )}
            
            {isOwner ? (
              <Dropdown
                menu={{
                  items: [
                    { key: 'PRIVATE', label: 'Riêng tư (Chỉ mình tôi)', icon: <LockOutlined /> },
                    { key: 'WORKSPACE', label: 'Workspace (Thành viên)', icon: <TeamOutlined /> },
                    { key: 'PUBLIC', label: 'Công khai (Mọi người)', icon: <GlobalOutlined /> },
                  ],
                  onClick: ({ key }) => handleUpdateProject({ visibility: key as any }),
                }}
                trigger={['click']}
              >
                <Tooltip title={`Quyền: ${currentProject?.visibility} (Nhấp để thay đổi)`}>
                  <div className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity flex items-center">
                    {currentProject?.visibility === 'PRIVATE' ? <LockOutlined /> : 
                    currentProject?.visibility === 'PUBLIC' ? <GlobalOutlined /> : <TeamOutlined />}
                  </div>
                </Tooltip>
              </Dropdown>
            ) : (
              <Tooltip title={`Quyền: ${currentProject?.visibility}`}>
                <div className="opacity-40 flex items-center">
                  {currentProject?.visibility === 'PRIVATE' ? <LockOutlined /> : 
                   currentProject?.visibility === 'PUBLIC' ? <GlobalOutlined /> : <TeamOutlined />}
                </div>
              </Tooltip>
            )}
          </div>

          <Tooltip 
            trigger={['click']}
            title={
              <div className="p-2 min-w-[200px]">
                <div className="font-bold mb-1 flex items-center gap-2">
                  Mô tả dự án {isOwner && <EditOutlined onClick={() => setIsEditingDesc(true)} className="cursor-pointer" />}
                </div>
                {isEditingDesc && isOwner ? (
                  <Input.TextArea
                    autoFocus
                    placeholder="Nhập mô tả..."
                    value={tempDesc}
                    onChange={(e) => setTempDesc(e.target.value)}
                    onBlur={onDescBlur}
                    rows={3}
                  />
                ) : (
                  <div className="text-sm opacity-90 italic">
                    {currentProject?.description || 'Chưa có mô tả...'}
                  </div>
                )}
              </div>
            }
          >
            <InfoCircleOutlined className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
          </Tooltip>

          <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-300'}`} />

          {/* View Mode Dropdown */}
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomLeft">
            <Button
              type="text"
              className={`
                flex items-center gap-2 px-3 h-8 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors
                ${theme === 'dark' ? 'text-white' : 'text-gray-800'}
              `}
            >
              <span className="text-base opacity-90 flex items-center">{currentView.icon}</span>
              <span className="font-semibold text-sm">{currentView.label}</span>
              <DownOutlined className="text-[10px] opacity-50 ml-1" />
            </Button>
          </Dropdown>

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
          {canEdit && (
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
          )}
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 min-h-0 relative">
        {viewMode === 'board' ? (
          <div
            ref={setBoardRef}
            id="board"
            className="
              flex h-full gap-4 p-4 pt-4
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

              {canAddColumn && canEdit && <AddColumn boardId={board.id} />}

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
        ) : viewMode === 'map' ? (
          <MapView board={board} />
        ) : (
          <DashboardView board={board} />
        )}
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        project={currentProject!}
      />
    </div>
  );
}
