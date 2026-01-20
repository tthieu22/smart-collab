'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Board as BoardType, Column as ColumnType } from '@smart/types/project';
import { useBoardStore } from '@smart/store/setting';
import { useDragContext } from '../dnd/DragContext';
import { projectStore } from '@smart/store/project';

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { useDroppable } from '@dnd-kit/core';

interface CardDroppedPayload {
  cardId: string;
  start: Date;
  end: Date;
}

interface EventDraggedOutPayload {
  cardId: string;
  pointer: { clientX: number; clientY: number };
  originalEventStart?: Date;
  originalEventEnd?: Date;
}

interface CalendarProps {
  board: BoardType;
  className?: string;
  onCardDropped?: (payload: CardDroppedPayload) => void;
  onEventDraggedOut?: (payload: EventDraggedOutPayload) => void;
}

export default function Calendar({
  board,
  className,
  onCardDropped,
  onEventDraggedOut,
}: CalendarProps) {
  const {
    registerScrollContainer,
    registerBoardScrollContainer,
    setOverData,
    activeItem,
    overData,
    overId,
  } = useDragContext();
  const theme = useBoardStore((s) => s.theme);

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const calendarRef = useRef<FullCalendar | null>(null);

  /** 🔴 QUAN TRỌNG: ref này CHỈ trỏ vào phần scroll của lịch */
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const draggingCalendarEventRef = useRef<{
    id: string;
    start?: Date;
    end?: Date;
  } | null>(null);

  const { boardColumns, columns } = projectStore();
  const columnIds = boardColumns[board.id] || [];
  const calendarColumn: ColumnType | undefined =
    columnIds.length > 0 ? columns[columnIds[0]] : undefined;

  if (!calendarColumn) {
    return (
      <div className="p-4 text-center text-red-600">
        Không tìm thấy cột cho calendar
      </div>
    );
  }

  const [dragPointer, setDragPointer] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);

  /**
   * =====================================================
   * Đăng ký scroll container cho DragContext
   * Calendar cần đăng ký cả column (vertical scroll) và board (horizontal scroll)
   * =====================================================
   */
  useEffect(() => {
    // Đăng ký column container cho vertical scroll (ưu tiên)
    if (calendarColumn?.id) {
      registerScrollContainer?.(calendarColumn.id, scrollContainerRef.current);
    }
    // Đăng ký board container cho horizontal scroll (fallback)
    registerBoardScrollContainer?.(board.id, scrollContainerRef.current);

    return () => {
      if (calendarColumn?.id) {
        registerScrollContainer?.(calendarColumn.id, null);
      }
      registerBoardScrollContainer?.(board.id, null);
    };
  }, [
    board.id,
    calendarColumn?.id,
    registerScrollContainer,
    registerBoardScrollContainer,
  ]);

  /**
   * =====================================================
   * dnd-kit DROPPABLE – chỉ gắn vào phần scroll grid
   * =====================================================
   */
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `calendar-${board.id}-${calendarColumn.id}`,
    data: {
      type: 'CALENDAR',
      boardId: board.id,
      columnId: calendarColumn.id,
    },
  });

  /**
   * =====================================================
   * Theo dõi pointer toàn cục (phục vụ auto-scroll + drop)
   * =====================================================
   */
  useEffect(() => {
    if (!activeItem) {
      setDragPointer(null);
      (window as any).__dragPointerPosition = null;
      return;
    }

    const onPointerMove = (ev: PointerEvent) => {
      const pos = { clientX: ev.clientX, clientY: ev.clientY };
      setDragPointer(pos);
      (window as any).__dragPointerPosition = pos;
    };

    window.addEventListener('pointermove', onPointerMove);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      setDragPointer(null);
      (window as any).__dragPointerPosition = null;
    };
  }, [activeItem]);

  /**
   * =====================================================
   * TÍNH GIỜ DROP – SỬ DỤNG VỊ TRÍ CHÍNH XÁC TỪ POINTER
   * Sử dụng FullCalendar's coordinate system để tính chính xác
   * =====================================================
   */
  const getDateFromPoint = useCallback((x: number, y: number): Date | null => {
    const container = scrollContainerRef.current;
    const api = calendarRef.current?.getApi();
    if (!container || !api) return null;

    // Lấy bounding rect của container (không bao gồm header)
    const rect = container.getBoundingClientRect();

    // Kiểm tra pointer có trong container không
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      return null;
    }

    try {
      // Sử dụng FullCalendar's coordinateToDate nếu có
      // Fallback về manual calculation nếu không có
      const calendarEl = container.querySelector(
        '.fc-timeGrid-view'
      ) as HTMLElement;
      if (calendarEl) {
        const calendarRect = calendarEl.getBoundingClientRect();
        const relativeX = x - calendarRect.left;
        const relativeY = y - calendarRect.top + container.scrollTop;

        // Tìm timeGrid body
        const timeGridBody = calendarEl.querySelector(
          '.fc-timegrid-body'
        ) as HTMLElement;
        if (timeGridBody) {
          const bodyRect = timeGridBody.getBoundingClientRect();
          const bodyRelativeY = y - bodyRect.top + container.scrollTop;

          // Tính toán dựa trên slot structure
          // slotMinTime: 05:00, slotMaxTime: 23:00, slotDuration: 00:30:00
          const slotMinHours = 5;
          const slotMaxHours = 23;
          const slotDurationMinutes = 30;
          const totalSlots =
            ((slotMaxHours - slotMinHours) * 60) / slotDurationMinutes; // 36 slots

          // Lấy chiều cao thực tế của timeGrid body
          const bodyScrollHeight = timeGridBody.scrollHeight;
          const pixelsPerSlot = bodyScrollHeight / totalSlots;
          const slotIndex = Math.floor(bodyRelativeY / pixelsPerSlot);
          const clampedSlotIndex = Math.max(
            0,
            Math.min(totalSlots - 1, slotIndex)
          );

          // Tính thời gian từ slot index
          const totalMinutes = clampedSlotIndex * slotDurationMinutes;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;

          // Tạo date từ view start date
          const viewStart = new Date(api.view.currentStart);
          const date = new Date(viewStart);
          date.setHours(slotMinHours + hours, minutes, 0, 0);

          return date;
        }
      }

      // Fallback: manual calculation
      const relativeY = y - rect.top + container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const slotMinHours = 5;
      const slotMaxHours = 23;
      const slotDurationMinutes = 30;
      const totalMinutes = (slotMaxHours - slotMinHours) * 60; // 1080 phút
      const minutesPerPixel = totalMinutes / scrollHeight;
      const minutes = Math.max(
        0,
        Math.min(totalMinutes, relativeY * minutesPerPixel)
      );

      const date = new Date(api.view.currentStart);
      date.setHours(slotMinHours, 0, 0, 0);
      date.setMinutes(date.getMinutes() + Math.floor(minutes));

      // Làm tròn đến 30 phút gần nhất
      const roundedMinutes =
        Math.round(date.getMinutes() / slotDurationMinutes) *
        slotDurationMinutes;
      date.setMinutes(roundedMinutes, 0, 0);

      return date;
    } catch (error) {
      console.error('Error calculating date from point:', error);
      return null;
    }
  }, []);

  /**
   * =====================================================
   * DRAG CARD → CALENDAR PREVIEW
   * Cập nhật vị trí drop chính xác khi kéo card vào calendar
   * =====================================================
   */
  useEffect(() => {
    if (
      !activeItem ||
      activeItem.type !== 'CARD' ||
      overId !== `calendar-${board.id}-${calendarColumn.id}` ||
      !dragPointer
    )
      return;

    // Tính toán vị trí drop chính xác từ pointer
    const start = getDateFromPoint(dragPointer.clientX, dragPointer.clientY);
    if (!start) {
      // Nếu pointer ngoài container, clear preview
      setOverData?.(null);
      return;
    }

    // Tạo event 1 giờ (mặc định)
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    setOverData?.({
      type: 'CALENDAR',
      boardId: board.id,
      columnId: calendarColumn.id,
      start: start.toISOString(),
      end: end.toISOString(),
    });
  }, [
    activeItem,
    overId,
    dragPointer,
    getDateFromPoint,
    setOverData,
    board.id,
    calendarColumn.id,
  ]);

  /**
   * =====================================================
   * FULLCALENDAR HANDLERS – GIỮ NGUYÊN
   * =====================================================
   */
  const handleNativeDrop = useCallback(
    (info: any) => {
      const cardId = info.draggedEl?.dataset.cardId;
      const title = info.draggedEl?.textContent ?? 'Untitled event';
      if (!cardId || !info.date) return;

      const start = info.date;
      const end = new Date(start.getTime() + 3600000);

      setCalendarEvents((evs) => [
        ...evs.filter((e) => e.id !== cardId),
        { id: cardId, title, start, end },
      ]);
      onCardDropped?.({ cardId, start, end });
    },
    [onCardDropped]
  );

  const handleEventChange = useCallback((info: any) => {
    const { id, start, end, title } = info.event;
    setCalendarEvents((evs) =>
      evs.map((e) => (e.id === id ? { id, start, end, title } : e))
    );
  }, []);

  const handleEventDragStart = useCallback(
    (info: any) => {
      const evt = info.event;
      draggingCalendarEventRef.current = {
        id: evt.id,
        start: evt.start,
        end: evt.end,
      };
      setOverData?.({ type: 'DRAGGING_CALENDAR_EVENT', cardId: evt.id });
    },
    [setOverData]
  );

  const handleEventDragStop = useCallback(
    (info: any) => {
      const dragging = draggingCalendarEventRef.current;
      draggingCalendarEventRef.current = null;
      setOverData?.(null);

      const pointer = (window as any).__dragPointerPosition;
      const rect = scrollContainerRef.current?.getBoundingClientRect();

      const inside =
        rect &&
        pointer &&
        pointer.clientX >= rect.left &&
        pointer.clientX <= rect.right &&
        pointer.clientY >= rect.top &&
        pointer.clientY <= rect.bottom;

      if (!inside && dragging) {
        onEventDraggedOut?.({
          cardId: dragging.id,
          pointer,
          originalEventStart: dragging.start,
          originalEventEnd: dragging.end,
        });
      }
    },
    [onEventDraggedOut, setOverData]
  );

  const draggingEventPreview = React.useMemo(() => {
    if (!overData || overData.type !== 'CALENDAR') return null;
    return {
      id: 'dragging-preview',
      title: 'Kéo thả tại đây',
      start: new Date(overData.start),
      end: new Date(overData.end),
      editable: false,
      display: 'auto',
    };
  }, [overData]);

  const displayedEvents = React.useMemo(() => {
    if (!draggingEventPreview) return calendarEvents;
    return [
      ...calendarEvents.filter((e) => e.id !== 'dragging-preview'),
      draggingEventPreview,
    ];
  }, [calendarEvents, draggingEventPreview]);

  /**
   * =====================================================
   * RENDER
   * =====================================================
   */
  return (
    <div
      className={`
        relative flex-1 rounded-xl border shadow-lg
        ${
          theme === 'dark'
            ? 'bg-gray-900 border-gray-700'
            : 'bg-white border-gray-200'
        }
        ${isOver ? 'ring-4 ring-blue-400/30' : ''}
        ${className ?? ''}
      `}
      style={{ minHeight: 750 }}
    >
      {/* ================= HEADER (FIXED – NO SCROLL) ================= */}
      <div className="h-14 px-4 flex items-center justify-between border-b dark:border-gray-700">
        <div className="font-semibold text-sm">
          {calendarRef.current?.getApi().view.title}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => calendarRef.current?.getApi().prev()}
            className="btn-cal"
          >
            Prev
          </button>
          <button
            onClick={() => calendarRef.current?.getApi().today()}
            className="btn-cal"
          >
            Today
          </button>
          <button
            onClick={() => calendarRef.current?.getApi().next()}
            className="btn-cal"
          >
            Next
          </button>
        </div>
      </div>

      {/* ================= SCROLL BODY ================= */}
      <div
        ref={(node) => {
          scrollContainerRef.current = node;
          setDroppableRef(node);
        }}
        className="h-[calc(100%-3.5rem)] overflow-auto"
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          headerToolbar={false}
          height="100%"
          expandRows
          editable
          droppable
          events={displayedEvents}
          drop={handleNativeDrop}
          eventDrop={handleEventChange}
          eventChange={handleEventChange}
          eventDragStart={handleEventDragStart}
          eventDragStop={handleEventDragStop}
          allDaySlot={false}
          nowIndicator
          slotMinTime="05:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
        />
      </div>
    </div>
  );
}
