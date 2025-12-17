'use client';

import React from 'react';
import { useDndMonitor } from '@dnd-kit/core';

interface Props {
  columnScrollContainers: React.MutableRefObject<Map<string, HTMLElement>>;
  boardScrollContainers: React.MutableRefObject<Map<string, HTMLElement>>;
  activeItem: any;
  overData: any;
}

export function DndMonitor({
  columnScrollContainers,
  boardScrollContainers,
  activeItem,
  overData,
}: Props) {
  useDndMonitor({
    onDragMove(event) {
      const { over, active } = event;
      if (!over) return;

      const overPayload: any = over.data?.current ?? overData;
      const translated = active.rect.current.translated ?? active.rect.current.initial;
      if (!translated) return;

      const pointerX = translated.left + translated.width / 2;
      const pointerY = translated.top + translated.height / 2;

      // 1. Scroll dọc trong cột Kanban
      let columnId: string | null = null;
      if (overPayload?.type === 'CARD') {
        columnId = overPayload.columnId ?? null;
      } else if (overPayload?.type === 'COLUMN') {
        columnId = overPayload.columnId ?? String(over.id);
      }
      if (columnId) {
        const container = columnScrollContainers.current.get(columnId);
        if (container) {
          const rect = container.getBoundingClientRect();
          const threshold = 80;
          const scrollStep = 100;

          if (pointerY < rect.top + threshold) {
            container.scrollTop = Math.max(0, container.scrollTop - scrollStep);
          } else if (pointerY > rect.bottom - threshold) {
            container.scrollTop += scrollStep;
          }
        }
      }

      // 2. Scroll dọc + ngang cho Calendar
      if (overPayload?.type === 'CALENDAR') {
        const boardId = overPayload.boardId;
        const container = boardScrollContainers.current.get(boardId);
        if (container) {
          const rect = container.getBoundingClientRect();
          const edgeSize = 60;
          const speed = 100;

          if (pointerY < rect.top + edgeSize) {
            container.scrollTop = Math.max(0, container.scrollTop - speed);
          } else if (pointerY > rect.bottom - edgeSize) {
            container.scrollTop += speed;
          }

          if (pointerX < rect.left + edgeSize) {
            container.scrollLeft = Math.max(0, container.scrollLeft - speed);
          } else if (pointerX > rect.right - edgeSize) {
            container.scrollLeft += speed;
          }
        }
        return; // Không scroll ngang board Kanban khi đang trên calendar
      }

      // 3. Scroll ngang cho board Kanban
      const boardId = overPayload?.boardId ?? active.data?.current?.boardId ?? activeItem?.boardId;
      if (!boardId) return;

      const boardContainer = boardScrollContainers.current.get(boardId);
      if (!boardContainer) return;

      const rect = boardContainer.getBoundingClientRect();
      const horizontalThreshold = 120;
      const horizontalStep = 100;

      if (pointerX < rect.left + horizontalThreshold) {
        boardContainer.scrollLeft = Math.max(0, boardContainer.scrollLeft - horizontalStep);
      } else if (pointerX > rect.right - horizontalThreshold) {
        boardContainer.scrollLeft += horizontalStep;
      }
    },
  });

  return null;
}
