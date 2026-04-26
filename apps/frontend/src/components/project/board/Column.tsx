'use client';

import React, {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './Card';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import { Column as ColumnType } from '@smart/types/project';
import { useDragContext } from '../dnd/DragContext';
import { useDroppable } from '@dnd-kit/core';
import { AddCard } from '../AddCard';
import { ColumnMenu } from './ColumnMenu';
import { SettingOutlined } from '@ant-design/icons';

interface Props {
  column: ColumnType;
  boardId: string;
  boardType: string;
  index: number;
  isOverlay?: boolean;
}

export default function Column({
  column,
  boardId,
  boardType,
  index,
  isOverlay,
}: Props) {
  const { activeItem, registerScrollContainer, overData, overId, overIndex } =
    useDragContext();

  // Lấy dữ liệu cần thiết từ store với useMemo
  const cards = projectStore((state) => state.cards);
  const columnCards = projectStore((state) => state.columnCards);
  const currentProject = projectStore((state) => state.currentProject);

  const cardIds = useMemo(() => columnCards[column.id] || [], [columnCards, column.id]);
  const projectId = currentProject?.id;

  if (!projectId) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center text-sm">
        Không tìm thấy Project ID
      </div>
    );
  }

  const isDraggingColumn = activeItem?.type === 'COLUMN';

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'COLUMN', boardId, boardType, columnId: column.id, index },
    disabled: boardType !== 'board',
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'COLUMN', columnId: column.id, boardId, boardType },
  });

  const [collapsed, setCollapsed] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Đăng ký container scroll để auto scroll khi kéo thả
  useEffect(() => {
    if (isOverlay) return;
    registerScrollContainer?.(column.id, scrollContainerRef.current);
    return () => {
      registerScrollContainer?.(column.id, null);
    };
  }, [column.id, isOverlay, registerScrollContainer]);

  // Memo hàm setRef để tránh tạo lại mỗi render
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) {
        setSortableRef(null);
        setDroppableRef(null);
        return;
      }
      setSortableRef(node);
      setDroppableRef(node);
    },
    [setSortableRef, setDroppableRef]
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDraggingCard = activeItem?.type === 'CARD';

  const ColumnPlaceholder = useMemo(
    () => (
      <div
        className="w-[320px] h-full rounded-2xl border-2 border-dashed border-blue-400/50 bg-blue-500/5 dark:bg-blue-400/5 animate-pulse flex flex-col p-4 shadow-inner"
      >
        <div className="h-6 bg-blue-300/30 dark:bg-blue-300/20 rounded w-1/2 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-blue-200/20 dark:bg-blue-200/10 rounded-xl border border-blue-300/20" />
          ))}
        </div>
      </div>
    ),
    []
  );

  // Dùng ref để tránh gọi API load card nhiều lần
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!loadedRef.current && cardIds.length === 0 && !isOverlay) {
      loadedRef.current = true;
      projectService.getCardByColumn(column.id).then((res: any) => {
        if (res.success) {
          projectStore.getState().addCard(column.id, res.data);
        }
      });
    }
  }, [column.id, cardIds.length, isOverlay]);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(column.title);

  // Đồng bộ title khi column từ store thay đổi (ví dụ qua socket)
  useEffect(() => {
    if (!isEditingTitle) {
      setNewTitle(column.title);
    }
  }, [column.title, isEditingTitle]);

  // Toggle collapsed
  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleFilter = useCallback(() => {
    console.log('Filter cards in column', column.id);
  }, [column.id]);

  const handleRename = useCallback(async () => {
    if (!newTitle.trim() || newTitle === column.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await projectService.updateColumn({
        columnId: column.id,
        title: newTitle.trim(),
      });
      if (res.status === 'success') {
        // Cập nhật local store nếu cần, hoặc dựa vào socket
        setIsEditingTitle(false);
      }
    } catch (error) {
      console.error('Failed to rename column', error);
    }
  }, [column.id, column.title, newTitle]);

  const handleDelete = useCallback(async () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa cột "${column.title}" và tất cả thẻ bên trong?`)) {
      try {
        const res = await projectService.deleteColumn(column.id);
        if (res.status === 'success') {
          // Xóa khỏi store local
          projectStore.getState().removeColumn(boardId, column.id);
        }
      } catch (error) {
        console.error('Failed to delete column', error);
      }
    }
  }, [column.id, column.title, boardId]);

  const extraItems = useMemo(
    () => [
      {
        key: 'custom-option',
        label: 'Tùy chọn khác',
        icon: <SettingOutlined />,
        onClick: () => console.log('Custom option click'),
        group: 'Tùy chọn khác',
      },
    ],
    []
  );



  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setSortableRef}
        id={column.id}
        style={style}
        className="flex-shrink-0"
      >
        {ColumnPlaceholder}
      </div>
    );
  }

  return (
    <div
      ref={setRef}
      id={column.id}
      data-column-id={column.id}
      style={{
        ...style,
        touchAction: 'none',
        ...(isOverlay ? { cursor: 'grabbing' } : {})
      }}
      {...(!isEditingTitle ? attributes : {})}
      {...(!isEditingTitle ? listeners : {})}
      className={`
        flex flex-col min-h-0 flex-shrink-0 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-10 overflow-hidden' : 'w-[320px]'}
        ${isOverlay ? 'h-auto max-h-[80vh] shadow-2xl ring-4 ring-blue-500/30 rotate-[2deg] scale-[1.02] z-[9999]' : 'h-full'}
        will-change-transform column-glass-neon p-2 font-sans
        ${!isEditingTitle ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      {/* ================= HEADER ================= */}
      {!collapsed ? (
        <div
          className="shrink-0 active:cursor-grabbing select-none mb-3"
        >
          <div className="flex items-center justify-between group/header">
            {isEditingTitle ? (
              <input
                autoFocus
                className="bg-white/10 border border-blue-500 outline-none rounded px-1 w-full text-sm font-bold text-gray-800 dark:text-gray-100"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={handleRename}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') {
                    setNewTitle(column.title);
                    setIsEditingTitle(false);
                  }
                }}
              />
            ) : (
              <h4
                className="truncate font-bold text-sm tracking-tight text-gray-800 dark:text-gray-100 cursor-text hover:bg-gray-200/50 dark:hover:bg-white/5 px-1 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }}
              >
                {column.title}
              </h4>
            )}
            <ColumnMenu
              collapsed={collapsed}
              onToggleCollapse={toggleCollapse}
              onFilter={handleFilter}
              onRename={() => setIsEditingTitle(true)}
              onDelete={handleDelete}
              extraItems={extraItems}
            />
          </div>
        </div>
      ) : (
        /* ================= COLLAPSED HEADER (Vertical Icon) ================= */
        <div className="flex flex-col items-center gap-4 py-2">
          <ColumnMenu
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
            onFilter={handleFilter}
            onRename={handleRename}
            onDelete={handleDelete}
            extraItems={extraItems}
          />
        </div>
      )}

      {/* ================= COLLAPSED VIEW ================= */}
      {collapsed && (
        <div
          className="flex-1 flex flex-col items-center justify-start cursor-pointer group mt-4"
          onClick={() => setCollapsed(false)}
          role="button"
          tabIndex={0}
        >
          <div
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed'
            }}
            className="whitespace-nowrap text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors"
          >
            {column.title}
          </div>
        </div>
      )}

      {/* ================= BODY (SCROLL) ================= */}
      {!collapsed && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-1"
          >
            <SortableContext
              items={cardIds}
              strategy={verticalListSortingStrategy}
              disabled={isDraggingColumn}
            >
              <div className="min-h-[100px] flex flex-col pb-20">
                {cardIds.map((cardId, idx) => {
                  const card = cards[cardId];
                  if (!card || card.status === 'ARCHIVED') return null;

                  return (
                    <Card
                      key={cardId}
                      card={card}
                      columnId={column.id}
                      boardId={boardId}
                      boardType={boardType}
                      index={idx}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      {!collapsed && (
        <div className="shrink-0">
          <AddCard projectId={projectId} columnId={column.id} />
        </div>
      )}
    </div>
  );

}
