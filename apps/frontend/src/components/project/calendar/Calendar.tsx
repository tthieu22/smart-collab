'use client';

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Board as BoardType, Column as ColumnType } from '@smart/types/project';
import { useBoardStore } from '@smart/store/setting';
import { useDragContext } from '../dnd/DragContext';
import { projectStore } from '@smart/store/project';
import { getProjectSocketManager } from '@smart/store/realtime';
import { useUserStore } from '@smart/store/user';
import CardDetailModal from '../cardDetailModal/CardDetailModalById';

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useDroppable } from '@dnd-kit/core';
import { Card as BoardCard } from '../board/Card';
import { CalendarHeader } from './components/CalendarHeader';
import { CalendarEvent } from './components/CalendarEvent';
import { CSS } from '@dnd-kit/utilities';

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
  const formatLocalDate = (value: Date) => {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const {
    registerScrollContainer,
    registerBoardScrollContainer,
    setOverData,
    activeItem,
    overData: contextOverData, // Rename to avoid confusion
    overId
  } = useDragContext();
  const theme = useBoardStore((s) => s.resolvedTheme);
  const calendarRef = useRef<FullCalendar | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('timeGridDay');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const userId = useUserStore((s) => s.currentUser?.id);
  const socket = useMemo(() => getProjectSocketManager(), []);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const draggingCalendarEventRef = useRef<{
    id: string;
    start?: Date;
    end?: Date;
  } | null>(null);
  const [draggingCalendarCardId, setDraggingCalendarCardId] = useState<string | null>(
    null
  );
  const lastCalendarMutationRef = useRef<string | null>(null);

  const { boardColumns, columns } = projectStore();
  const columnIds = boardColumns[board.id] || [];
  const calendarColumn: ColumnType | undefined =
    columnIds.length > 0 ? columns[columnIds[0]] : undefined;

  const [dragPointer, setDragPointer] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);

  useEffect(() => {
    if (calendarColumn?.id) {
      registerScrollContainer?.(calendarColumn.id, scrollContainerRef.current);
    }
    registerBoardScrollContainer?.(board.id, scrollContainerRef.current);

    return () => {
      if (calendarColumn?.id) {
        registerScrollContainer?.(calendarColumn.id, null);
      }
      registerBoardScrollContainer?.(board.id, null);
    };
  }, [board.id, calendarColumn?.id, registerScrollContainer, registerBoardScrollContainer]);

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `calendar-${board.id}-${calendarColumn?.id || 'unknown'}`,
    data: {
      type: 'CALENDAR',
      boardId: board.id,
      columnId: calendarColumn?.id,
    },
  });

  useEffect(() => {
    if (!activeItem && !draggingCalendarCardId) {
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
  }, [activeItem, draggingCalendarCardId]);

  const getDateFromPoint = useCallback((x: number, y: number): Date | null => {
    const container = scrollContainerRef.current;
    const api = calendarRef.current?.getApi();
    if (!container || !api) return null;

    const rect = container.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      return null;
    }

    try {
      const colEl = document
        .elementFromPoint(x, y)
        ?.closest('.fc-timegrid-col[data-date]') as HTMLElement | null;
      const dateStr =
        colEl?.getAttribute('data-date') ??
        formatLocalDate(api.view.currentStart);
      if (!dateStr) return null;

      const slots = Array.from(
        container.querySelectorAll('.fc-timegrid-slot-lane[data-time]')
      ) as HTMLElement[];
      if (!slots.length) return null;

      let chosenTime = slots[slots.length - 1]?.getAttribute('data-time') ?? '23:00:00';
      for (const slot of slots) {
        const slotRect = slot.getBoundingClientRect();
        if (y <= slotRect.top + slotRect.height / 2) {
          chosenTime = slot.getAttribute('data-time') ?? chosenTime;
          break;
        }
      }

      const candidate = new Date(`${dateStr}T${chosenTime}`);
      if (Number.isNaN(candidate.getTime())) return null;
      return candidate;
    } catch (error) {
      console.error('Error calculating date from point:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (
      !activeItem ||
      activeItem.type !== 'CARD' ||
      overId !== `calendar-${board.id}-${calendarColumn?.id}` ||
      !dragPointer
    )
      return;

    const start = getDateFromPoint(dragPointer.clientX, dragPointer.clientY);
    if (!start) {
      if (contextOverData !== null) {
        setOverData?.(null);
      }
      return;
    }

    const startTime = start.getTime();
    const endTime = startTime + 60 * 60 * 1000;

    // IMPORTANT: Prevent infinite loop by checking if values actually changed
    const current = contextOverData;
    if (
      current?.type === 'CALENDAR' &&
      current?.boardId === board.id &&
      current?.columnId === calendarColumn?.id &&
      current?.start === startTime &&
      current?.end === endTime
    ) {
      return;
    }

    setOverData?.({
      type: 'CALENDAR',
      boardId: board.id,
      columnId: calendarColumn?.id,
      start: startTime,
      end: endTime,
    });
  }, [activeItem, overId, dragPointer, getDateFromPoint, setOverData, board.id, calendarColumn?.id, contextOverData]);

  const cards = projectStore((s) => s.cards);
  const columnCards = projectStore((s) => s.columnCards);
  const boards = projectStore((s) => s.boards);
  const columnsMap = projectStore((s) => s.columns);
  const currentProjectId = projectStore((s) => s.currentProject?.id);

  const calendarEvents = useMemo(() => {
    const ids = columnIds.flatMap((id) => columnCards[id] || []);
    const uniqueIds = Array.from(new Set(ids));
    return uniqueIds
      .map((id) => cards[id])
      .filter(Boolean)
      .map((card) => {
        const start = card.startDate ? new Date(card.startDate) : (card.deadline ? new Date(card.deadline) : null);
        if (!start || Number.isNaN(start.getTime())) return null;

        let end = card.deadline ? new Date(card.deadline) : null;
        if (!end || Number.isNaN(end.getTime()) || end <= start) {
          end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour
        }

        return {
          id: card.id,
          title: card.title,
          start,
          end,
          extendedProps: {
            card,
            priority: card.priority,
            labels: card.labels,
            members: card.members,
            description: card.description,
          },
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          borderColor: card.priority === 3 ? '#ef4444' : (card.priority === 2 ? '#f59e0b' : '#3b82f6'),
          textColor: theme === 'dark' ? '#f3f4f6' : '#111827',
        };
      })
      .filter(Boolean) as any[];
  }, [cards, columnCards, columnIds, theme]);

  const handleNativeDrop = useCallback(
    (info: any) => {
      const cardId = info.draggedEl?.dataset.cardId;
      if (!cardId || !info.date) return;

      const start = info.date;
      const end = new Date(start.getTime() + 3600000);
      onCardDropped?.({ cardId, start, end });
    },
    [onCardDropped]
  );

  const handleEventChange = useCallback((info: any) => {
    const { id, start, end } = info.event;
    if (!id || !start) return;

    const startIso = start.toISOString();
    const endIso = end ? end.toISOString() : null;

    const mutationKey = `${id}:${startIso}:${endIso}`;
    if (lastCalendarMutationRef.current === mutationKey) return;
    lastCalendarMutationRef.current = mutationKey;

    // optimistic local update
    const existing = cards[id];
    if (existing) {
      projectStore.getState().updateCard({
        ...existing,
        startDate: startIso,
        deadline: endIso
      });
    }

    // Call socket for realtime update - MUST pass projectId
    socket.updateCard(
      currentProjectId ?? undefined,
      id,
      'update-basic',
      {
        startDate: startIso,
        deadline: endIso
      },
      userId
    );

    onCardDropped?.({
      cardId: id,
      start,
      end: end || new Date(start.getTime() + 3600000)
    });
  }, [cards, currentProjectId, onCardDropped, socket, userId]);

  const handleEventClick = useCallback((info: any) => {
    const id = info?.event?.id;
    if (!id) return;
    setSelectedCardId(id);
  }, []);

  const handleEventDragStart = useCallback(
    (info: any) => {
      const evt = info.event;
      draggingCalendarEventRef.current = {
        id: evt.id,
        start: evt.start,
        end: evt.end,
      };
      setDraggingCalendarCardId(evt.id);
      setOverData?.({ type: 'DRAGGING_CALENDAR_EVENT', cardId: evt.id });
    },
    [setOverData]
  );

  const handleEventDragStop = useCallback(
    (info: any) => {
      const dragging = draggingCalendarEventRef.current;
      draggingCalendarEventRef.current = null;
      setDraggingCalendarCardId(null);
      setOverData?.(null);

      const nativePointer = info?.jsEvent
        ? { clientX: info.jsEvent.clientX, clientY: info.jsEvent.clientY }
        : null;
      const pointer = nativePointer ?? (window as any).__dragPointerPosition;
      const rect = scrollContainerRef.current?.getBoundingClientRect();

      const inside =
        Boolean(rect && pointer) &&
        pointer.clientX >= (rect?.left ?? 0) &&
        pointer.clientX <= (rect?.right ?? 0) &&
        pointer.clientY >= (rect?.top ?? 0) &&
        pointer.clientY <= (rect?.bottom ?? 0);

      if (!inside && dragging && pointer) {
        const sourceColumnId = cards[dragging.id]?.columnId;
        const sourceBoardId = sourceColumnId ? columnsMap[sourceColumnId]?.boardId : undefined;
        const sourceBoardType = sourceBoardId ? boards[sourceBoardId]?.type : undefined;

        const allColumnIds = Object.keys(columnsMap).filter(cid => cid !== sourceColumnId);
        const el = document.elementFromPoint(pointer.clientX, pointer.clientY) as HTMLElement | null;

        let destColumnId: string | undefined;
        if (el) {
          for (const cid of allColumnIds) {
            const target = document.getElementById(cid);
            if (target && target.contains(el)) {
              destColumnId = cid;
              break;
            }
          }
        }

        if (!destColumnId && allColumnIds.length) {
          let best: { id: string; score: number } | null = null;
          for (const cid of allColumnIds) {
            const target = document.getElementById(cid);
            if (!target) continue;
            const r = target.getBoundingClientRect();
            const dx = pointer.clientX - Math.max(r.left, Math.min(pointer.clientX, r.right));
            const dy = pointer.clientY - Math.max(r.top, Math.min(pointer.clientY, r.bottom));
            const score = dx * dx + dy * dy;
            if (!best || score < best.score) best = { id: cid, score };
          }
          destColumnId = best?.id;
        }

        if (sourceColumnId && destColumnId) {
          const destBoardId = columnsMap[destColumnId]?.boardId ?? undefined;
          const safeSourceBoardId = sourceBoardId ?? undefined;
          const destBoardType = destBoardId ? boards[destBoardId]?.type : undefined;
          const scopeProjectId = sourceBoardType === 'board' && destBoardType === 'board' ? currentProjectId : undefined;
          const targetColumnElement = document.getElementById(destColumnId);
          const currentDestCardIds = (columnCards[destColumnId] || []).filter(id => id !== dragging.id);
          let destIndex = currentDestCardIds.length;

          if (targetColumnElement) {
            const cardElements = Array.from(targetColumnElement.querySelectorAll<HTMLElement>('[data-card-id]'))
              .filter(node => node.dataset.cardId && node.dataset.cardId !== dragging.id);

            for (const node of cardElements) {
              const cardId = node.dataset.cardId;
              if (!cardId) continue;
              const rect = node.getBoundingClientRect();
              if (pointer.clientY < rect.top + rect.height / 2) {
                const idx = currentDestCardIds.indexOf(cardId);
                if (idx !== -1) {
                  destIndex = idx;
                  break;
                }
              }
            }
          }

          socket.moveCard(
            { projectId: scopeProjectId, userId },
            {
              cardId: dragging.id,
              srcBoardId: safeSourceBoardId,
              destBoardId,
              srcColumnId: sourceColumnId,
              destColumnId,
              destIndex,
              userId,
            }
          );
        }

        onEventDraggedOut?.({
          cardId: dragging.id,
          pointer,
          originalEventStart: dragging.start,
          originalEventEnd: dragging.end,
        });
      }
    },
    [boards, cards, columnCards, columnsMap, currentProjectId, onEventDraggedOut, setOverData, socket, userId]
  );

  const draggingEventPreview = React.useMemo(() => {
    if (!contextOverData || contextOverData.type !== 'CALENDAR') return null;
    return {
      id: 'dragging-preview',
      title: 'Kéo thả tại đây',
      start: new Date(contextOverData.start),
      end: new Date(contextOverData.end),
      editable: false,
      display: 'auto',
    };
  }, [contextOverData]);

  const displayedEvents = React.useMemo(() => {
    if (!draggingEventPreview) return calendarEvents;
    return [
      ...calendarEvents.filter((e) => e.id !== 'dragging-preview'),
      {
        ...draggingEventPreview,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6',
        className: 'dragging-preview-event'
      },
    ];
  }, [calendarEvents, draggingEventPreview]);

  const renderEventContent = useCallback((eventInfo: any) => {
    return <CalendarEvent eventInfo={eventInfo} draggingCalendarCardId={draggingCalendarCardId} />;
  }, [draggingCalendarCardId]);

  const draggingCardOverlay = useMemo(() => {
    if (!draggingCalendarCardId || !dragPointer) return null;
    const rect = scrollContainerRef.current?.getBoundingClientRect();
    const isInside = Boolean(rect && dragPointer) &&
      dragPointer.clientX >= (rect?.left ?? 0) &&
      dragPointer.clientX <= (rect?.right ?? 0) &&
      dragPointer.clientY >= (rect?.top ?? 0) &&
      dragPointer.clientY <= (rect?.bottom ?? 0);

    if (isInside) return null;

    const draggingCard = cards[draggingCalendarCardId];
    if (!draggingCard) return null;
    const sourceColumnId = draggingCard.columnId;
    const sourceBoardId = sourceColumnId ? columnsMap[sourceColumnId]?.boardId : undefined;
    const sourceBoardType = sourceBoardId ? boards[sourceBoardId]?.type : undefined;
    if (!sourceColumnId || !sourceBoardId || !sourceBoardType) return null;

    return (
      <div
        className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2 origin-top-left"
        style={{ left: dragPointer.clientX, top: dragPointer.clientY, width: 284 }}
      >
        <BoardCard
          card={draggingCard}
          columnId={sourceColumnId}
          boardId={sourceBoardId}
          boardType={sourceBoardType}
          index={draggingCard.position ?? 0}
          isOverlay
        />
      </div>
    );
  }, [boards, cards, columnsMap, dragPointer, draggingCalendarCardId]);

  if (!calendarColumn) {
    return <div className="p-4 text-center text-red-600">Không tìm thấy cột cho calendar</div>;
  }

  const calendarPlugins = useMemo(() => [timeGridPlugin, dayGridPlugin, interactionPlugin, listPlugin], []);
  const calendarViews = useMemo(() => ({
    timeGridThreeDay: { type: 'timeGrid', duration: { days: 3 }, buttonText: '3 ngày' },
    timeGridFiveDay: { type: 'timeGrid', duration: { days: 5 }, buttonText: '5 ngày' }
  }), []);

  const slotLabelFormat = useMemo(() => ({
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    omitZeroMinute: true,
    meridiem: 'short' as const
  }), []);

  const dayHeaderFormat = useMemo(() => ({
    weekday: 'long' as const,
    day: 'numeric' as const
  }), []);

  const handleDatesSet = useCallback((arg: any) => {
    const newDate = arg.view.currentStart;
    if (newDate.getTime() !== currentDate.getTime()) {
      setCurrentDate(newDate);
    }
  }, [currentDate]);

  return (
    <>
      <CardDetailModal
        cardId={selectedCardId || ''}
        isOpen={Boolean(selectedCardId)}
        onClose={() => setSelectedCardId(null)}
      />
      <div
        className={`relative flex-1 flex flex-col overflow-hidden max-w-full transition-colors duration-200 ${theme === 'dark' ? 'bg-[#141517]' : 'bg-white'} ${isOver ? 'ring-4 ring-blue-500/20' : ''} ${className ?? ''}`}
        style={{ minHeight: 750 }}
      >
        <CalendarHeader
          currentDate={currentDate}
          viewMode={viewMode}
          onPrev={() => {
            calendarRef.current?.getApi().prev();
          }}
          onNext={() => {
            calendarRef.current?.getApi().next();
          }}
          onToday={() => {
            calendarRef.current?.getApi().today();
          }}
          onDateChange={(date) => {
            calendarRef.current?.getApi().gotoDate(date);
          }}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            calendarRef.current?.getApi().changeView(mode);
          }}
          theme={theme}
        />

        <div
          ref={(node) => {
            scrollContainerRef.current = node;
            setDroppableRef(node);
          }}
          className="flex-1 overflow-auto bg-gray-50/30 dark:bg-black/10"
        >
          <style jsx global>{`
            .fc {
              --fc-border-color: ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
              --fc-page-bg-color: transparent;
              --fc-today-bg-color: ${theme === 'dark' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)'};
              --fc-now-indicator-color: #ef4444;
              font-family: inherit;
              max-width: 100%;
            }
            .fc .fc-timegrid-slot {
              height: 4em !important;
              border-bottom: 1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} !important;
            }
            .fc .fc-timegrid-slot-label {
              font-size: 0.65rem;
              font-weight: 500;
              color: ${theme === 'dark' ? '#9aa0a6' : '#5f6368'};
              text-transform: lowercase;
              padding: 0 12px;
              vertical-align: top !important;
            }
            .fc .fc-col-header-cell {
              padding: 16px 0;
              background: ${theme === 'dark' ? '#141517' : '#ffffff'};
              border: none !important;
              border-bottom: 1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} !important;
            }
            .fc .fc-col-header-cell-cushion {
              font-size: 0.9rem;
              font-weight: 700;
              color: ${theme === 'dark' ? '#e8eaed' : '#202124'};
              text-decoration: none !important;
              text-transform: capitalize;
            }
            .fc .fc-timegrid-axis-cushion {
               font-size: 0.65rem;
               color: ${theme === 'dark' ? '#9aa0a0' : '#5f6368'};
            }
            .fc .fc-scrollgrid {
              border: none !important;
            }
            .fc-theme-standard td, .fc-theme-standard th {
                border-color: ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
            }
            .fc .fc-event {
              border-radius: 8px;
              border: 1px solid rgba(59, 130, 246, 0.2);
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              transition: transform 0.2s, box-shadow 0.2s;
              cursor: pointer;
            }
            .fc .fc-timegrid-event-harness:hover {
              z-index: 100 !important;
            }
            .fc .fc-event:hover {
              transform: translateY(-2px) scale(1.01);
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              transition: all 0.2s ease;
            }
            .fc-v-event .fc-event-main { color: inherit; }
            .fc-timegrid-now-indicator-arrow { border-width: 5px 0 5px 6px; border-top-color: transparent; border-bottom-color: transparent; }
            .fc .fc-list-event:hover td { background-color: ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}; }
          `}</style>
          <FullCalendar
            ref={calendarRef}
            plugins={calendarPlugins}
            initialView="timeGridDay"
            views={calendarViews}
            headerToolbar={false}
            height="100%"
            expandRows
            editable
            droppable
            events={displayedEvents}
            eventContent={renderEventContent}
            drop={handleNativeDrop}
            eventDrop={handleEventChange}
            eventResize={handleEventChange}
            eventChange={handleEventChange}
            eventDragStart={handleEventDragStart}
            eventDragStop={handleEventDragStop}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            allDaySlot={true}
            nowIndicator
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:30:00"
            dayMaxEvents={true}
            stickyHeaderDates={true}
            slotLabelFormat={slotLabelFormat}
            dayHeaderFormat={dayHeaderFormat}
          />
        </div>
      </div>
      {draggingCardOverlay}
    </>
  );
}
