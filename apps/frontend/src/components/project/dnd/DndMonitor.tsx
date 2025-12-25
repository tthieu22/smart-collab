'use client';

import React, { useRef } from 'react';
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
  const lastScrollTime = useRef(0);

  useDndMonitor({
    onDragMove({ activatorEvent, over, active }) {
      if (!activatorEvent || !(activatorEvent instanceof MouseEvent)) return;

      const now = performance.now();
      if (now - lastScrollTime.current < 16) return; // ~60fps
      lastScrollTime.current = now;

      const pointerX = activatorEvent.clientX;
      const pointerY = activatorEvent.clientY;

      const payload = over?.data?.current ?? overData;

      /* ========================= */
      /* 1. Scroll dọc trong column */
      /* ========================= */

      let columnId: string | null = null;

      if (payload?.type === 'CARD') {
        columnId = payload.columnId;
      } else if (payload?.type === 'COLUMN') {
        columnId = payload.columnId ?? String(over?.id);
      }

      if (columnId) {
        const container = columnScrollContainers.current.get(columnId);
        if (container) {
          const rect = container.getBoundingClientRect();
          const edge = 60;
          const maxSpeed = 18;

          if (pointerY < rect.top + edge) {
            const intensity = (rect.top + edge - pointerY) / edge;
            container.scrollTop -= maxSpeed * intensity;
          } else if (pointerY > rect.bottom - edge) {
            const intensity = (pointerY - (rect.bottom - edge)) / edge;
            container.scrollTop += maxSpeed * intensity;
          }
        }
      }

      /* ========================= */
      /* 2. Scroll calendar (2 chiều) */
      /* ========================= */

      if (payload?.type === 'CALENDAR') {
        const container = boardScrollContainers.current.get(payload.boardId);
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const edge = 60;
        const maxSpeed = 20;

        if (pointerY < rect.top + edge) {
          container.scrollTop -= maxSpeed;
        } else if (pointerY > rect.bottom - edge) {
          container.scrollTop += maxSpeed;
        }

        if (pointerX < rect.left + edge) {
          container.scrollLeft -= maxSpeed;
        } else if (pointerX > rect.right - edge) {
          container.scrollLeft += maxSpeed;
        }

        return;
      }

      /* ========================= */
      /* 3. Scroll ngang board Kanban */
      /* ========================= */

      const boardId =
        payload?.boardId ??
        active.data?.current?.boardId ??
        activeItem?.boardId;

      if (!boardId) return;

      const boardContainer = boardScrollContainers.current.get(boardId);
      if (!boardContainer) return;

      const rect = boardContainer.getBoundingClientRect();
      const edge = 80;
      const maxSpeed = 16;

      if (pointerX < rect.left + edge) {
        const intensity = (rect.left + edge - pointerX) / edge;
        boardContainer.scrollLeft -= maxSpeed * intensity;
      } else if (pointerX > rect.right - edge) {
        const intensity = (pointerX - (rect.right - edge)) / edge;
        boardContainer.scrollLeft += maxSpeed * intensity;
      }
    },
  });

  return null;
}
