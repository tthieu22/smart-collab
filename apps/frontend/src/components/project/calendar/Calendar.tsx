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
  const { registerBoardScrollContainer, setOverData, activeItem, overData, overId } = useDragContext();
  const theme = useBoardStore(s => s.theme);

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const calendarRef = useRef<FullCalendar | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const draggingCalendarEventRef = useRef<{ id: string; start?: Date; end?: Date } | null>(null);

  const { boardColumns, columns } = projectStore();
  const columnIds = boardColumns[board.id] || [];
  const calendarColumn: ColumnType | undefined = columnIds.length > 0 ? columns[columnIds[0]] : undefined;

  if (!calendarColumn) {
    return <div className="p-4 text-center text-red-600">Không tìm thấy cột cho calendar</div>;
  }

  const [dragPointer, setDragPointer] = useState<{ clientX: number; clientY: number } | null>(null);

  useEffect(() => {
    registerBoardScrollContainer?.(board.id, scrollContainerRef.current);
    return () => registerBoardScrollContainer?.(board.id, null);
  }, [board.id, registerBoardScrollContainer]);

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `calendar-${board.id}-${calendarColumn.id}`,
    data: {
      type: 'CALENDAR',
      boardId: board.id,
      columnId: calendarColumn.id,
    },
  });

  const setCalendarRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollContainerRef.current = node;
      setDroppableRef(node);
    },
    [setDroppableRef]
  );

  useEffect(() => {
    if (!activeItem) {
      setDragPointer(null);
      (window as any).__dragPointerPosition = null;
      return;
    }
    function onPointerMove(ev: PointerEvent) {
      setDragPointer({ clientX: ev.clientX, clientY: ev.clientY });
      (window as any).__dragPointerPosition = { clientX: ev.clientX, clientY: ev.clientY };
    }
    window.addEventListener('pointermove', onPointerMove);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      setDragPointer(null);
      (window as any).__dragPointerPosition = null;
    };
  }, [activeItem]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !dragPointer) return;

    const SCROLL_MARGIN = 40;
    const SCROLL_SPEED = 10;

    const rect = container.getBoundingClientRect();
    let scrollDelta = 0;

    if (dragPointer.clientY < rect.top + SCROLL_MARGIN) {
      scrollDelta = -SCROLL_SPEED;
    } else if (dragPointer.clientY > rect.bottom - SCROLL_MARGIN) {
      scrollDelta = SCROLL_SPEED;
    }

    if (scrollDelta === 0) return;

    let animationFrameId: number;

    const step = () => {
      container.scrollTop += scrollDelta;
      animationFrameId = requestAnimationFrame(step);
    };

    step();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dragPointer]);

  const getDateFromPoint = useCallback((x: number, y: number): Date | null => {
    const container = scrollContainerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const api = calendarRef.current?.getApi();
    if (!api) return null;

    const relativeX = x - rect.left + container.scrollLeft;
    const relativeY = y - rect.top + container.scrollTop;

    const viewStart = api.view.currentStart;
    const viewEnd = api.view.currentEnd;
    const dayCount = Math.round((viewEnd.getTime() - viewStart.getTime()) / 86400000);
    const dayWidth = rect.width / dayCount;

    let dayIndex = Math.floor(relativeX / dayWidth);
    dayIndex = Math.max(0, Math.min(dayIndex, dayCount - 1));

    const minutesPerPixel = (24 * 60) / container.scrollHeight;
    let minutes = relativeY * minutesPerPixel;
    minutes = Math.max(0, Math.min(minutes, 24 * 60));

    const date = new Date(viewStart);
    date.setDate(date.getDate() + dayIndex);
    date.setHours(Math.floor(minutes / 60), Math.floor(minutes % 60));

    return date;
  }, []);

  useEffect(() => {
    if (!activeItem || activeItem.type !== 'CARD') return;
    if (!overId || overId !== `calendar-${board.id}-${calendarColumn.id}`) return;
    if (!dragPointer) return;

    const start = getDateFromPoint(dragPointer.clientX, dragPointer.clientY);
    if (!start) return;

    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const payload = {
      type: 'CALENDAR',
      boardId: board.id,
      columnId: calendarColumn.id,
      start: start.toISOString(),
      end: end.toISOString(),
    };
    setOverData?.(payload);
  }, [activeItem, overId, board.id, calendarColumn.id, getDateFromPoint, setOverData, dragPointer]);

  const handleNativeDrop = useCallback(
    (info: any) => {
      const cardId = info.draggedEl?.dataset.cardId;
      const title = info.draggedEl?.textContent ?? 'Untitled event';

      if (!cardId || !info.date) return;

      const start = info.date;
      const end = new Date(start.getTime() + 3600000);

      setCalendarEvents(evs => [
        ...evs.filter(e => e.id !== cardId),
        { id: cardId, title, start, end },
      ]);
      onCardDropped?.({ cardId, start, end });
    },
    [onCardDropped]
  );

  const handleEventChange = useCallback((info: any) => {
    const { id, start, end, title } = info.event;
    setCalendarEvents(evs => evs.map(e => (e.id === id ? { id, start, end, title } : e)));
  }, []);

  const handleEventDragStart = useCallback(
    (info: any) => {
      const evt = info.event;
      draggingCalendarEventRef.current = { id: evt.id, start: evt.start, end: evt.end };
      setOverData?.({ type: 'DRAGGING_CALENDAR_EVENT', cardId: evt.id });
    },
    [setOverData]
  );

  const handleEventDragStop = useCallback(
    (info: any) => {
      const dragging = draggingCalendarEventRef.current;
      draggingCalendarEventRef.current = null;
      setOverData?.(null);

      const pointer =
        (window as any).__dragPointerPosition ?? { clientX: info.jsEvent?.clientX, clientY: info.jsEvent?.clientY };
      if (!pointer) return;

      const rect = scrollContainerRef.current?.getBoundingClientRect();
      const inside =
        rect &&
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
    if (
      !activeItem ||
      activeItem.type !== 'CARD' ||
      !overData ||
      overData.type !== 'CALENDAR' ||
      overId !== `calendar-${board.id}-${calendarColumn.id}`
    ) {
      return null;
    }

    return {
      id: 'dragging-preview',
      title: 'Kéo thả tại đây',
      start: new Date(overData.start),
      end: new Date(overData.end),
      backgroundColor: 'rgba(0, 123, 255, 0.3)',
      borderColor: '#007bff',
      display: 'auto',
      editable: false,
    };
  }, [activeItem, overData, overId, board.id, calendarColumn.id]);

  const displayedEvents = React.useMemo(() => {
    if (!draggingEventPreview) return calendarEvents;
    return [...calendarEvents.filter(e => e.id !== draggingEventPreview.id), draggingEventPreview];
  }, [calendarEvents, draggingEventPreview]);
  return (
    <div
      ref={setCalendarRef}
      className={`
        relative flex-1 rounded-xl overflow-hidden shadow-lg border
        ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
        ${isOver ? 'ring-4 ring-blue-400 ring-opacity-30 bg-blue-50 dark:bg-blue-950/30' : ''}
        ${className ?? ''}
      `}
      style={{ minHeight: 750 }}
    >
      {/* Container scroll chính, dùng cho dnd-kit + scroll khi kéo */}
      <div
        ref={(node) => {
          scrollContainerRef.current = node;
          setDroppableRef(node);
        }}
        className="h-full w-full overflow-auto"
        style={{ scrollbarGutter: 'stable' }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay" // Chỉ hiển thị mỗi ngày
          headerToolbar={{
            left: 'title',
            center: 'prev,today,next',
            right: '', // vẫn cho phép chuyển sang tuần nếu muốn
          }}
          buttonText={{ today: 'Today'}}

          height="100%"           // full chiều cao container cha
          contentHeight="auto"
          expandRows={true}

          editable
          droppable
          dragScroll={true}       // FullCalendar tự scroll khi kéo event trong calendar

          events={displayedEvents}
          drop={handleNativeDrop}
          eventDrop={handleEventChange}
          eventChange={handleEventChange}
          eventDragStart={handleEventDragStart}
          eventDragStop={handleEventDragStop}

          // Style class names cho đẹp và phù hợp theme
          slotLaneClassNames="bg-transparent"
          slotLabelClassNames={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
          dayHeaderClassNames={`bg-gray-50 dark:bg-gray-800/70 font-semibold text-sm uppercase tracking-wider ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}
          dayCellClassNames={`border-r border-b ${
            theme === 'dark' ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
          }`}
          nowIndicatorClassNames="bg-red-500"

          eventClassNames={(arg) => {
            const isPreview = arg.event.id === 'dragging-preview';
            return [
              'rounded-lg shadow-md transition-all duration-200 cursor-pointer font-medium text-sm',
              isPreview
                ? 'opacity-70 border-2 border-dashed border-blue-400 bg-blue-100 dark:bg-blue-900/50'
                : 'hover:shadow-lg hover:scale-[1.02]',
              theme === 'dark' ? 'text-white' : 'text-white',
            ].join(' ');
          }}

          eventContent={(eventInfo) => {
            const isPreview = eventInfo.event.id === 'dragging-preview';
            return (
              <div className={`px-2 py-1 h-full flex flex-col justify-center rounded-lg ${isPreview ? 'italic' : ''}`}>
                <div className="truncate font-semibold">{eventInfo.event.title}</div>
                <div className="text-xs opacity-90">{eventInfo.timeText}</div>
              </div>
            );
          }}

          allDaySlot={false}
          nowIndicator={true}
          slotMinTime="05:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          scrollTime="08:00:00"
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </div>

      {/* Style nút header toolbar của FullCalendar */}
      <style jsx global>{`
        /* Nút chung */
        .fc .fc-button {
          padding: 4px 8px;            /* padding nhỏ hơn */
          font-weight: 500;            /* font-weight nhẹ hơn */
          font-size: 0.75rem;          /* text-xs (12px) */
          border-radius: 0.375rem;     /* rounded-md */
          border: 1px solid transparent;
          cursor: pointer;
          transition: background-color 0.2s, border-color 0.2s, color 0.2s;
        }

        /* Title nhỏ hơn */
        .fc .fc-toolbar-title {
          font-size: 1rem;             /* 16px, nhỏ hơn mặc định */
          font-weight: 500;
          line-height: 1.2;
        }

        /* Light theme nút */
        .fc .fc-button {
          background-color: white;
          color: #374151; /* gray-700 */
        }
        .fc .fc-button:hover {
          background-color: #e5e7eb; /* gray-200 */
          color: #1f2937; /* gray-900 */
        }
        .fc .fc-button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }
        .fc .fc-button:active {
          background-color: #d1d5db; /* gray-300 */
        }
        .fc .fc-button.fc-button-active {
          background-color: #3b82f6; /* blue-500 */
          border-color: #2563eb; /* blue-600 */
          color: white;
        }
        .fc .fc-button.fc-button-active:hover {
          background-color: #2563eb; /* blue-600 */
          border-color: #1d4ed8; /* blue-700 */
        }

        /* Dark theme nút */
        .dark .fc .fc-button {
          background-color: #1f2937; /* gray-800 */
          color: #d1d5db; /* gray-300 */
          border-color: #374151; /* gray-700 */
        }
        .dark .fc .fc-button:hover {
          background-color: #374151; /* gray-700 */
          color: white;
        }
        .dark .fc .fc-button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }
        .dark .fc .fc-button:active {
          background-color: #4b5563; /* gray-600 */
        }
        .dark .fc .fc-button.fc-button-active {
          background-color: #3b82f6; /* blue-500 */
          border-color: #2563eb; /* blue-600 */
          color: white;
        }
        .dark .fc .fc-button.fc-button-active:hover {
          background-color: #2563eb;
          border-color: #1d4ed8;
        }
      `}</style>

    </div>
  );


}
