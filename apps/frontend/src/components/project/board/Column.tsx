'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Column as ColumnType, Card as CardType } from '@smart/types/project';
import { Card } from './Card';
import { projectStore } from '@smart/store/project';
import { AddCard } from '@smart/components/project/AddCard';
import { projectService } from '@smart/services/project.service';
import { ColumnMenu } from './ColumnMenu';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { createPortal } from 'react-dom';
import React from 'react';

interface ColumnProps {
  column: ColumnType;
}

export default function Column({ column }: ColumnProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [titleWidth, setTitleWidth] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const titleRef = useRef<HTMLSpanElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentProject = projectStore((s) => s.currentProject);
  const cardsStore = projectStore((s) => s.cards);

  const cards: CardType[] = (column.cardIds ?? [])
    .map((id) => cardsStore[id])
    .filter(Boolean);

  // Fetch card nếu chưa có
  useEffect(() => {
    if (!cards.length) fetchCardsByColumn(column.id);
  }, [column.id]);

  async function fetchCardsByColumn(columnId: string) {
    try {
      const response: any = await projectService.getCardByColumn(columnId);
      if (response.success && Array.isArray(response.data)) {
        projectStore.getState().addCard(columnId, response.data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Tính title width
  useLayoutEffect(() => {
    const measEl = measureRef.current;
    if (!measEl) return;
    measEl.textContent = column.title || '';
    setTitleWidth(Math.ceil(measEl.getBoundingClientRect().width));
  }, [column.title]);

  useEffect(() => {
    const handleResize = () => {
      const measEl = measureRef.current;
      if (!measEl) return;
      measEl.textContent = column.title || '';
      setTitleWidth(Math.ceil(measEl.getBoundingClientRect().width));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [column.title]);

  const collapsedHeight = titleWidth ? titleWidth + 40 : 180;

  const handleDragEnter = () => {
    setIsDragOver(true);
    if (collapsed && !expandTimeoutRef.current) {
      expandTimeoutRef.current = setTimeout(() => {
        setCollapsed(false);
        expandTimeoutRef.current = null;
      }, 400);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    },
    []
  );

  if (!currentProject) return null;

  return (
    <>
      {/* Hidden measurement */}
      <div
        ref={measureRef}
        style={{
          position: 'absolute',
          left: -9999,
          top: -9999,
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          fontSize: '0.875rem',
          fontWeight: 600,
          lineHeight: 1.2,
        }}
        aria-hidden
      />

      <div
        ref={containerRef}
        className={`relative flex flex-col rounded-2xl shadow-md border transition-all duration-300 bg-white/30 border-white/20 text-gray-900 hover:shadow-lg backdrop-blur-sm dark:bg-black/30 dark:border-black/20 dark:text-gray-100 text-sm ${
          collapsed
            ? 'min-w-[48px] max-w-[48px]'
            : 'min-w-[260px] max-w-[280px]'
        } ${isDragOver ? 'ring-2 ring-blue-400/60' : ''}`}
        style={collapsed ? { height: `${collapsedHeight}px` } : {}}
      >
        {/* Header */}
        <div className="px-4 py-2 rounded-t-2xl font-semibold flex items-center justify-between bg-white/40 text-gray-800 border-b border-white/30 dark:bg-black/40 dark:text-gray-200 dark:border-black/30 select-none">
          {!collapsed ? (
            <>
              <span ref={titleRef} className="truncate inline-block">
                {column.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full shadow-sm border border-gray-200/50 flex items-center justify-center min-w-[22px] text-center">
                  {cards.length}
                </span>
                <ColumnMenu
                  collapsed={collapsed}
                  onToggleCollapse={() => setCollapsed((prev) => !prev)}
                  onFilter={() => console.log('Filter clicked')}
                />
              </div>
            </>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={() => setCollapsed(false)}
            >
              <div
                className="flex flex-col items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 rotate-90 whitespace-nowrap"
                style={{ height: `${collapsedHeight - 20}px` }}
              >
                <span>{column.title}</span>
              </div>
            </div>
          )}
        </div>

        {/* Cards */}
        {!collapsed && (
          <Droppable
            droppableId={column.id}
            type="CARD"
            ignoreContainerClipping={true}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`flex flex-col gap-2 max-h-[70vh] overflow-y-auto scrollbar-hide transition-all duration-300 ${
                  snapshot.isDraggingOver
                    ? 'bg-white/40 dark:bg-black/40 ring-2 ring-blue-400/40 dark:ring-blue-500/30'
                    : 'bg-transparent'
                }`}
              >
                {cards.length ? (
                  cards.map((c, i) => (
                    <Draggable key={c.id} draggableId={c.id} index={i}>
                      {(provided, snapshot) => {
                        const child = (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              userSelect: 'none',
                            }}
                          >
                            <Card card={c} />
                          </div>
                        );

                        return snapshot.isDragging
                          ? createPortal(child, document.body)
                          : child;
                      }}
                    </Draggable>
                  ))
                ) : (
                  <div className="text-center text-gray-400 dark:text-gray-600 italic select-none text-xs">
                    No cards yet
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}

        {/* Add Card */}
        {!collapsed && (
          <div className="p-3 border-t border-white/20 dark:border-black/20">
            <AddCard projectId={currentProject.id} columnId={column.id} />
          </div>
        )}
      </div>
    </>
  );
}
