'use client';

import React, { useRef, useEffect } from 'react';
import {
  useDndMonitor,
  DragMoveEvent,
  DragEndEvent,
  DragCancelEvent,
} from '@dnd-kit/core';
import { ScrollController } from './ScrollController';

interface DragItemData {
  type: 'CARD' | 'COLUMN' | 'BOARD' | 'CALENDAR';
  boardId?: string;
  columnId?: string;
  boardType?: string;
  index?: number;
  start?: string;
  end?: string;
}

interface Props {
  columnScrollContainers: React.MutableRefObject<Map<string, HTMLElement>>;
  boardScrollContainers: React.MutableRefObject<Map<string, HTMLElement>>;
  activeItem: DragItemData | null;
  overData: DragItemData | null;
}

/**
 * DndMonitor - Handles auto-scroll during drag operations
 *
 * Scroll Priority Rules:
 * 1. CARD DRAG: Column vertical scroll has FIRST priority, board horizontal scroll is FALLBACK
 * 2. COLUMN DRAG: ONLY board horizontal scroll, NEVER column vertical scroll
 * 3. Scroll starts ONLY when pointer is near edge
 * 4. Scroll speed increases smoothly based on proximity
 * 5. Scroll stops immediately when pointer leaves edge or drag ends
 */
export function DndMonitor({
  columnScrollContainers,
  boardScrollContainers,
  activeItem,
  overData,
}: Props) {
  const scrollControllerRef = useRef<ScrollController | null>(null);

  // Initialize scroll controller once
  useEffect(() => {
    scrollControllerRef.current = new ScrollController();
    return () => {
      scrollControllerRef.current?.destroy();
    };
  }, []);

  useDndMonitor({
    onDragMove(event: DragMoveEvent) {
      const { over, active } = event;
      const controller = scrollControllerRef.current;

      if (!controller || !over || !activeItem) {
        controller?.stop();
        return;
      }

      // Get pointer position from active element's translated rect
      const translated =
        active.rect.current.translated ?? active.rect.current.initial;
      if (!translated) {
        controller.stop();
        return;
      }

      // Calculate pointer center position
      const pointerX = translated.left + translated.width / 2;
      const pointerY = translated.top + translated.height / 2;

      // Determine if we're dragging a column
      const isDraggingColumn = activeItem.type === 'COLUMN';

      // Resolve column container (only for card drags)
      // Calendar also uses column container for vertical scrolling
      let columnContainer: HTMLElement | null = null;
      if (!isDraggingColumn) {
        const overPayload = (over.data?.current ??
          overData) as DragItemData | null;
        let columnId: string | null = null;

        if (overPayload?.type === 'CARD') {
          columnId = overPayload.columnId ?? null;
        } else if (overPayload?.type === 'COLUMN') {
          columnId = overPayload.columnId ?? String(over.id);
        } else if (overPayload?.type === 'CALENDAR') {
          // Calendar uses column container for vertical scrolling
          columnId = overPayload.columnId ?? null;
        }

        if (columnId) {
          columnContainer =
            columnScrollContainers.current.get(columnId) ?? null;
        }
      }

      // Resolve board container
      const overPayload = (over.data?.current ??
        overData) as DragItemData | null;
      const boardId =
        overPayload?.boardId ??
        (active.data?.current as DragItemData | null)?.boardId ??
        activeItem?.boardId;

      const boardContainer = boardId
        ? boardScrollContainers.current.get(boardId) ?? null
        : null;

      // Update scroll target (controller handles priority and edge detection)
      controller.updateScrollTarget(
        { x: pointerX, y: pointerY },
        columnContainer,
        boardContainer,
        isDraggingColumn
      );
    },

    onDragEnd(_event: DragEndEvent) {
      scrollControllerRef.current?.stop();
    },

    onDragCancel(_event: DragCancelEvent) {
      scrollControllerRef.current?.stop();
    },
  });

  return null;
}
