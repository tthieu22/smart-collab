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
import interactionPlugin from '@fullcalendar/interaction';

import { useDroppable } from '@dnd-kit/core';
import { Card as BoardCard } from '../board/Card';

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
    overData,
    overId,
  } = useDragContext();
  const theme = useBoardStore((s) => s.theme);
  const calendarRef = useRef<FullCalendar | null>(null);
  const [viewTitle, setViewTitle] = useState('Calendar');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const userId = useUserStore((s) => s.currentUser?.id);
  const socket = useMemo(() => getProjectSocketManager(), []);

  /** 🔴 QUAN TRỌNG: ref này CHỈ trỏ vào phần scroll của lịch */
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
      start: start.getTime(),
      end: end.getTime(),
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
        const start = card.deadline ? new Date(card.deadline) : null;
        if (!start || Number.isNaN(start.getTime())) return null;
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        return { id: card.id, title: card.title, start, end };
      })
      .filter(Boolean) as Array<{ id: string; title: string; start: Date; end: Date }>;
  }, [cards, columnCards, columnIds]);

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
    if (!id || !start || !end) return;
    const iso = start.toISOString();
    const mutationKey = `${id}:${iso}`;
    if (lastCalendarMutationRef.current === mutationKey) return;
    lastCalendarMutationRef.current = mutationKey;

    // optimistic local update
    const existing = projectStore.getState().cards[id];
    if (existing) {
      projectStore.getState().updateCard({ ...existing, deadline: iso });
    }
    socket.updateCard(undefined, id, 'update-basic', { deadline: iso }, userId);
    onCardDropped?.({ cardId: id, start, end });
  }, [onCardDropped, socket, userId]);

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
        ? {
            clientX: info.jsEvent.clientX,
            clientY: info.jsEvent.clientY,
          }
        : null;
      const pointer = nativePointer ?? (window as any).__dragPointerPosition;
      const rect = scrollContainerRef.current?.getBoundingClientRect();

      const inside =
        Boolean(rect && pointer) &&
        pointer.clientX >= (rect?.left ?? 0) &&
        pointer.clientX <= (rect?.right ?? 0) &&
        pointer.clientY >= (rect?.top ?? 0) &&
        pointer.clientY <= (rect?.bottom ?? 0);

      if (!inside && dragging) {
        if (pointer) {
          const sourceColumnId = cards[dragging.id]?.columnId;
          const sourceBoardId = sourceColumnId ? columnsMap[sourceColumnId]?.boardId : undefined;
          const sourceBoardType = sourceBoardId ? boards[sourceBoardId]?.type : undefined;

          const allColumnIds = Object.keys(columnsMap).filter(
            (cid) => cid !== sourceColumnId
          );
          const el = document.elementFromPoint(pointer.clientX, pointer.clientY) as HTMLElement | null;

          let destColumnId: string | undefined;
          if (el) {
            for (const cid of allColumnIds) {
              const target = document.getElementById(cid);
              if (target && (target === el || target.contains(el) || el.closest(`#${CSS.escape(cid)}`))) {
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
            const scopeProjectId =
              sourceBoardType === 'board' && destBoardType === 'board'
                ? currentProjectId
                : undefined;
            const targetColumnElement = document.getElementById(destColumnId);
            const currentDestCardIds = (columnCards[destColumnId] || []).filter(
              (id) => id !== dragging.id
            );
            let destIndex = currentDestCardIds.length;

            if (targetColumnElement) {
              const cardElements = Array.from(
                targetColumnElement.querySelectorAll<HTMLElement>('[data-card-id]')
              ).filter((node) => {
                const id = node.dataset.cardId;
                return Boolean(id && id !== dragging.id);
              });

              for (const node of cardElements) {
                const cardId = node.dataset.cardId;
                if (!cardId) continue;
                const rect = node.getBoundingClientRect();
                const insertBefore = pointer.clientY < rect.top + rect.height / 2;
                if (insertBefore) {
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
        }

        onEventDraggedOut?.({
          cardId: dragging.id,
          pointer,
          originalEventStart: dragging.start,
          originalEventEnd: dragging.end,
        });
      }
    },
    [
      boards,
      cards,
      columnCards,
      columnsMap,
      currentProjectId,
      onEventDraggedOut,
      setOverData,
      socket,
      userId,
    ]
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

  const draggingCardOverlay = useMemo(() => {
    if (!draggingCalendarCardId || !dragPointer) return null;
    
    // Chỉ hiện overlay BoardCard khi kéo thả trỏ chuột ra NGOÀI khu vực lịch
    // Bên trong lịch sẽ hiển thị component ghost mặc định của FullCalendar
    const rect = scrollContainerRef.current?.getBoundingClientRect();
    const isInside =
      Boolean(rect && dragPointer) &&
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
        style={{
          left: dragPointer.clientX,
          top: dragPointer.clientY,
          width: 284, // Trùng với width của Column (max-w-[300px] - p-2*2)
        }}
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

  /**
   * =====================================================
   * RENDER
   * =====================================================
   */
  return (
    <>
      <CardDetailModal
        cardId={selectedCardId || ''}
        isOpen={Boolean(selectedCardId)}
        onClose={() => setSelectedCardId(null)}
      />
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
        <div className="font-semibold text-sm">{viewTitle}</div>
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
          eventClick={handleEventClick}
          datesSet={(arg) => setViewTitle(arg.view.title)}
          allDaySlot={false}
          nowIndicator
          slotMinTime="05:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
        />
      </div>
      </div>
      {draggingCardOverlay}
    </>
  );
}
