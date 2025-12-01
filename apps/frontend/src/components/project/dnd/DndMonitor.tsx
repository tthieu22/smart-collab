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
      const translated =
        active.rect.current.translated ?? active.rect.current.initial;
      if (!translated) return;

      // === 1. Scroll dọc trong cột Kanban (CARD hoặc COLUMN) ===
      let columnId: string | null = null;

      if (overPayload?.type === 'CARD') {
        columnId = overPayload.columnId ?? null;
      } else if (overPayload?.type === 'COLUMN') {
        columnId = overPayload.columnId ?? String(over.id);
      }

      if (columnId) {
        const container = columnScrollContainers.current.get(columnId);
        if (container) {
          const pointerY = translated.top + translated.height / 2;
          const { top, bottom } = container.getBoundingClientRect();
          const threshold = 80;
          const scrollStep = 18;

          if (pointerY < top + threshold) {
            container.scrollTop -= scrollStep;
          } else if (pointerY > bottom - threshold) {
            container.scrollTop += scrollStep;
          }
        }
      }

      // === 2. Scroll dọc + ngang cho Calendar ===
      if (overPayload?.type === 'CALENDAR') {
        const boardId = overPayload.boardId;
        const container = boardScrollContainers.current.get(boardId);

        if (container) {
          const rect = container.getBoundingClientRect();
          const edgeSize = 60; // vùng gần mép để bắt đầu scroll
          const speed = 20;

          const pointerX = translated.left + translated.width / 2;
          const pointerY = translated.top + translated.height / 2;

          // Scroll dọc (thời gian)
          if (pointerY < rect.top + edgeSize) {
            container.scrollTop -= speed;
          } else if (pointerY > rect.bottom - edgeSize) {
            container.scrollTop += speed;
          }

          // Scroll ngang (ngày/tháng)
          if (pointerX < rect.left + edgeSize) {
            container.scrollLeft -= speed;
          } else if (pointerX > rect.right - edgeSize) {
            container.scrollLeft += speed;
          }
        }

        // Nếu đang kéo trên calendar thì không scroll ngang board Kanban nữa
        return;
      }

      // === 3. Scroll ngang cho board Kanban ===
      const boardId =
        overPayload?.boardId ?? active.data?.current?.boardId ?? activeItem?.boardId;

      if (!boardId) return;

      const boardContainer = boardScrollContainers.current.get(boardId);
      if (!boardContainer) return;

      const pointerX = translated.left + translated.width / 2;
      const { left, right } = boardContainer.getBoundingClientRect();
      const horizontalThreshold = 120;
      const horizontalStep = 28;

      if (pointerX < left + horizontalThreshold) {
        boardContainer.scrollLeft -= horizontalStep;
      } else if (pointerX > right - horizontalThreshold) {
        boardContainer.scrollLeft += horizontalStep;
      }
    },
  });

  return null;
}
