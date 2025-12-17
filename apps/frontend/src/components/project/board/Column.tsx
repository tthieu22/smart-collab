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
      style={style}
      data-testid="list-wrapper"
      className={`flex-shrink-0 will-change-transform ${collapsed ? 'w-12' : ''}`}
    >
      <div
        className={`column-glass-neon ${collapsed ? 'max-w-12' : ''}`}
        data-testid="list"
      >
        {/* Header */}
        {!collapsed && (
          <div
            className="p-3 cursor-grab active:cursor-grabbing select-none"
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none' }}
          >
            <h3 className="text-lg flex items-center justify-between">
              <span className="font-bold">{column.title}</span>
              <span className="">{cardIds.length}</span>
              <ColumnMenu
                collapsed={collapsed}
                onToggleCollapse={toggleCollapse}
                onFilter={handleFilter}
                onRename={handleRename}
                onDelete={handleDelete}
                extraItems={extraItems}
              />
            </h3>
          </div>
        )}

        {collapsed && (
          <div
            className="inset-0 flex items-center justify-center cursor-pointer"
            onClick={() => setCollapsed(false)}
            role="button"
            tabIndex={0}
            aria-label={`Expand column ${column.title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setCollapsed(false);
            }}
          >
            <div
              className="flex flex-col items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 rotate-90 whitespace-nowrap"
              style={{ height: collapsedHeight }}
            >
              <span>{column.title}</span>
            </div>
          </div>
        )}

        {/* Nội dung card + footer chỉ hiện khi không collapsed */}
        {!collapsed && (
          <>
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-white/30 dark:scrollbar-thumb-white/20"
            >
              <SortableContext
                items={cardIds}
                strategy={verticalListSortingStrategy}
                disabled={isDraggingColumn}
              >
                <ol className="space-y-2 min-h-[60px]">
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
                </ol>
              </SortableContext>
            </div>

            <div className="p-3 pt-0">
              <AddCard projectId={projectId} columnId={column.id} />
            </div>
          </>
        )}
      </div>

      {/* Overlay khi kéo */}
      {isOverlay && (
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            transform:
              style?.transform?.replace(/,\s*0px\)/, ', 0px)') ?? undefined,
          }}
        >
          <div className="frosted-glass-neon">
            <h3 className="font-extrabold text-xl">
              {column.title}
              <span className="block text-xs mt-1 opacity-90">
                ({cardIds.length} cards)
              </span>
            </h3>
            <div className="flex-1 mt-4 bg-gradient-to-b from-blue-300/30 via-transparent to-purple-300/20 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
