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
  const { activeItem, registerScrollContainer, overData, overId } =
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

  const showPlaceholder = useMemo(() => {
    if (!isDraggingCard || isOverlay) return false;

    return (
      (isOver && overData?.type !== 'CARD') ||
      (overData?.type === 'COLUMN' && overData.columnId === column.id) ||
      (overData?.type === 'BOARD' && overData.boardId === boardId && cardIds.length === 0)
    );
  }, [isDraggingCard, isOverlay, isOver, overData, boardId, cardIds.length, column.id]);

  const shouldShowBeforeCard = useCallback(
    (cardId: string) => {
      if (!isDraggingCard || isOverlay) return false;
      if (!overData || overData?.type !== 'CARD') return false;
      if (overData.columnId !== column.id) return false;
      return String(overId) === String(cardId);
    },
    [isDraggingCard, isOverlay, overData, overId, column.id]
  );

  const DropIndicator = useMemo(
    () => (
      <div className="h-28 rounded-xl border-2 border-dashed border-blue-400/80 bg-blue-500/15 dark:bg-blue-400/10 animate-pulse pointer-events-none backdrop-blur-sm ring-1 ring-blue-400/50">
        <div className="h-4 bg-blue-300/60 dark:bg-blue-300/50 rounded w-3/4 mt-3 mx-3" />
        <div className="h-3 bg-blue-200/50 dark:bg-blue-200/40 rounded w-1/2 mt-2 mx-3" />
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

  // Toggle collapsed
  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleFilter = useCallback(() => {
    console.log('Filter cards in column', column.id);
  }, [column.id]);

  const handleRename = useCallback(() => {
    console.log('Rename column', column.id);
  }, [column.id]);

  const handleDelete = useCallback(() => {
    console.log('Delete column', column.id);
  }, [column.id]);

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

  // Đo chiều rộng tiêu đề - debounce resize event để tránh tốn performance
  const [titleWidth, setTitleWidth] = useState<number | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const debounceTimeout = useRef<number | null>(null);

  const measureTitleWidth = useCallback(() => {
    const measEl = measureRef.current;
    if (!measEl) return;
    measEl.textContent = column.title || '';
    setTitleWidth(Math.ceil(measEl.getBoundingClientRect().width));
  }, [column.title]);

  useLayoutEffect(() => {
    measureTitleWidth();
  }, [measureTitleWidth]);

  useEffect(() => {
    const handleResize = () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = window.setTimeout(() => {
        measureTitleWidth();
      }, 200);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [measureTitleWidth]);

  const collapsedHeight = titleWidth ? titleWidth + 40 : 180;

  return (
    <div
      ref={setRef}
      id={column.id}
      data-column-id={column.id}
      style={style}
      className={`
        flex flex-col h-full min-h-0 flex-shrink-0
        ${collapsed ? 'w-12' : 'max-w-[300px]'}
        will-change-transform column-glass-neon p-2
      `}
    >
      {/* ================= HEADER ================= */}
      {!collapsed && (
        <div
          className="shrink-0 active:cursor-grabbing select-none"
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
        >
          <div className="flex items-center justify-between">
            <h4 className="truncate">{column.title}</h4>
            <ColumnMenu
              collapsed={collapsed}
              onToggleCollapse={toggleCollapse}
              onFilter={handleFilter}
              onRename={handleRename}
              onDelete={handleDelete}
              extraItems={extraItems}
            />
          </div>
        </div>
      )}

      {/* ================= COLLAPSED VIEW ================= */}
      {collapsed && (
        <div
          className="flex-1 flex items-center justify-center cursor-pointer"
          onClick={() => setCollapsed(false)}
          role="button"
          tabIndex={0}
        >
          <div
            className="rotate-90 whitespace-nowrap text-xs font-medium text-gray-700 dark:text-gray-200"
            style={{ height: collapsedHeight }}
          >
            {column.title}
          </div>
        </div>
      )}

      {/* ================= BODY (SCROLL) ================= */}
      {!collapsed && (
        <div className="min-h-0">
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto overflow-x-hidden"
          >
            <SortableContext
              items={cardIds}
              strategy={verticalListSortingStrategy}
              disabled={isDraggingColumn}
            >
              <div className="min-h-[60px]">
                {cardIds.map((cardId, idx) => {
                  const card = cards[cardId];
                  if (!card) return null;

                  const insertBefore = shouldShowBeforeCard(cardId);

                  return (
                    <Fragment key={cardId}>
                      {insertBefore && DropIndicator}
                      <Card
                        card={card}
                        columnId={column.id}
                        boardId={boardId}
                        boardType={boardType}
                        index={idx}
                      />
                    </Fragment>
                  );
                })}
                {showPlaceholder && DropIndicator}
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
