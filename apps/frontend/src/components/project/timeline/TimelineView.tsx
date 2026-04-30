'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { theme as antdTheme, Avatar, Button, Typography, message, Badge } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Board as BoardType, Card } from '@smart/types/project';
import { projectStore } from '@smart/store/project';
import { useBoardStore } from '@smart/store/setting';
import CardDetailModal from '@smart/components/project/cardDetailModal/CardDetailModalById';
import { LeftOutlined, RightOutlined, UnorderedListOutlined, PlusOutlined, DragOutlined } from '@ant-design/icons';
import { getProjectSocketManager } from '@smart/store/realtime';
import { useUserStore } from '@smart/store/user';

dayjs.extend(isBetween);

const { Text, Title } = Typography;

interface Props {
  board: BoardType;
}

const TimelineView: React.FC<Props> = ({ board }) => {
  const { token } = antdTheme.useToken();
  const theme = useBoardStore((s) => s.theme);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const { currentUser } = useUserStore();

  const [viewDate, setViewDate] = useState(dayjs().startOf('day'));
  const daysToShow = 120; 
  const dayWidth = 64;   

  const { cards, columnCards, boardColumns, updateCard } = projectStore();

  const scheduledCards = useMemo(() => {
    const columnIds = boardColumns[board.id] || [];
    const allCardIds = columnIds.flatMap((colId) => columnCards[colId] || []);
    return allCardIds
      .map((id) => cards[id])
      .filter((card): card is Card => Boolean(card && card.startDate && card.deadline))
      .sort((a, b) => {
        const diff = dayjs(a.startDate).unix() - dayjs(b.startDate).unix();
        if (diff !== 0) return diff;
        return a.id.localeCompare(b.id);
      });
  }, [board.id, boardColumns, columnCards, cards]);

  const unscheduledCards = useMemo(() => {
    const columnIds = boardColumns[board.id] || [];
    const allCardIds = columnIds.flatMap((colId) => columnCards[colId] || []);
    return allCardIds
      .map((id) => cards[id])
      .filter((card): card is Card => Boolean(card && (!card.startDate || !card.deadline)));
  }, [board.id, boardColumns, columnCards, cards]);

  const { startDate, days } = useMemo(() => {
    const start = viewDate.subtract(30, 'day').startOf('day');
    const daysArr: Dayjs[] = [];
    for (let i = 0; i < daysToShow; i++) {
      daysArr.push(start.add(i, 'day'));
    }
    return { startDate: start, days: daysArr };
  }, [viewDate, daysToShow]);

  const handleUpdateDates = useCallback(async (cardId: string, start: Dayjs, end: Dayjs) => {
    try {
      const socket = getProjectSocketManager();
      const card = cards[cardId];
      if (!card) return;
      const newStart = start.toISOString();
      const newEnd = end.toISOString();
      updateCard({ ...card, startDate: newStart, deadline: newEnd });
      await socket.updateCard(board.projectId || '', cardId, 'update-basic', { ...card, startDate: newStart, deadline: newEnd }, currentUser?.id);
    } catch (err) {
      message.error('Cập nhật thất bại');
    }
  }, [cards, board.projectId, currentUser?.id, updateCard]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const today = dayjs().startOf('day');
      const diff = today.diff(startDate, 'day');
      containerRef.current.scrollLeft = diff * dayWidth - 200;
    }
  }, [startDate]);

  // INTERACTION STATE
  const [dragState, setDragState] = useState<{
    cardId: string;
    type: 'move' | 'resize-left' | 'resize-right' | 'sidebar-drag';
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    initialStart: Dayjs;
    initialEnd: Dayjs;
  } | null>(null);

  const onInteractionStart = (e: React.MouseEvent | React.PointerEvent, card: Card, type: 'move' | 'resize-left' | 'resize-right' | 'sidebar-drag') => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      cardId: card.id,
      type,
      startX: e.pageX,
      startY: e.pageY,
      currentX: e.pageX,
      currentY: e.pageY,
      initialStart: card.startDate ? dayjs(card.startDate) : dayjs().startOf('day'),
      initialEnd: card.deadline ? dayjs(card.deadline) : dayjs().add(2, 'day').endOf('day'),
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const onMouseMove = (e: MouseEvent) => {
      setDragState(prev => prev ? { ...prev, currentX: e.pageX, currentY: e.pageY } : null);
    };

    const onMouseUp = (e: MouseEvent) => {
      const { cardId, type, initialStart, initialEnd, startX } = dragState;
      
      if (type === 'sidebar-drag') {
        // Calculate where it dropped on the timeline
        if (containerRef.current) {
          const gridRect = containerRef.current.getBoundingClientRect();
          // Check if it's over the grid
          if (e.pageX >= gridRect.left && e.pageX <= gridRect.right) {
            const scrollLeft = containerRef.current.scrollLeft;
            const xInGrid = e.pageX - gridRect.left + scrollLeft;
            const dayIndex = Math.floor(xInGrid / dayWidth);
            const droppedDate = startDate.add(dayIndex, 'day');
            
            handleUpdateDates(cardId, droppedDate, droppedDate.add(2, 'day'));
          }
        }
      } else {
        const diffX = e.pageX - startX;
        const diffDays = Math.round(diffX / dayWidth);

        if (diffDays !== 0) {
          if (type === 'move') {
            handleUpdateDates(cardId, initialStart.add(diffDays, 'day'), initialEnd.add(diffDays, 'day'));
          } else if (type === 'resize-left') {
            handleUpdateDates(cardId, initialStart.add(diffDays, 'day'), initialEnd);
          } else if (type === 'resize-right') {
            handleUpdateDates(cardId, initialStart, initialEnd.add(diffDays, 'day'));
          }
        } else if (type === 'move') {
          setSelectedCardId(cardId);
        }
      }
      
      setDragState(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragState, handleUpdateDates, startDate]);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-white dark:bg-[#1e1f22] select-none">
      
      {/* Sidebar */}
      <div className="w-72 flex flex-col border-r dark:border-white/10 bg-gray-50/50 dark:bg-black/20">
        <div className="p-4 border-b dark:border-white/10 flex items-center justify-between">
          <Title level={5} className="m-0 !text-xs uppercase tracking-widest opacity-60">
            <UnorderedListOutlined className="mr-2" /> Unscheduled
          </Title>
          <Badge count={unscheduledCards.length} color={token.colorPrimary} size="small" />
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
          {unscheduledCards.map(card => (
            <div 
              key={card.id} 
              className={`p-3 bg-white dark:bg-white/5 border dark:border-white/10 rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-colors shadow-sm relative group ${dragState?.cardId === card.id ? 'opacity-30' : ''}`} 
              onMouseDown={(e) => onInteractionStart(e, card, 'sidebar-drag')}
              onClick={() => !dragState && setSelectedCardId(card.id)}
            >
              <Text strong className="text-xs block mb-1 truncate">{card.title}</Text>
              <div className="flex items-center justify-between">
                 <Text className="text-[10px] opacity-40">Chưa lên lịch</Text>
                 <DragOutlined className="opacity-20 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between p-4 border-b dark:border-white/10 bg-white/80 dark:bg-[#1e1f22]/80 backdrop-blur-md z-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-full p-1 border dark:border-white/10">
              <Button type="text" shape="circle" size="small" icon={<LeftOutlined style={{ fontSize: 10 }} />} onClick={() => setViewDate(prev => prev.subtract(7, 'day'))} />
              <Text className="px-4 text-[11px] font-bold min-w-[150px] text-center">{days[0].format('MMM D')} - {days[days.length - 1].format('MMM D, YYYY')}</Text>
              <Button type="text" shape="circle" size="small" icon={<RightOutlined style={{ fontSize: 10 }} />} onClick={() => setViewDate(prev => prev.add(7, 'day'))} />
            </div>
            <Button size="small" onClick={() => setViewDate(dayjs())} className="text-[10px] uppercase font-bold">Today</Button>
          </div>
          <Text className="text-[10px] opacity-40 italic uppercase tracking-tighter">Kéo thẻ từ trái vào lịch để lên lịch nhanh</Text>
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto custom-scrollbar relative">
          <div style={{ width: daysToShow * dayWidth, minHeight: '100%' }} className="relative">
            
            {/* Headers */}
            <div className="sticky top-0 z-40 flex border-b dark:border-white/10 bg-white dark:bg-[#1e1f22]">
              {days.map((day, idx) => (
                <div key={idx} style={{ width: dayWidth }} className={`flex flex-col items-center py-2 border-r dark:border-white/5 shrink-0 ${day.isSame(dayjs(), 'day') ? 'bg-blue-500/10' : ''}`}>
                  <Text className={`text-[9px] uppercase opacity-40 ${day.isSame(dayjs(), 'day') ? 'text-blue-500 font-bold opacity-100' : ''}`}>{day.format('ddd')}</Text>
                  <Text className={`text-xs font-semibold ${day.isSame(dayjs(), 'day') ? 'text-blue-500 font-bold' : ''}`}>{day.format('D')}</Text>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="absolute top-0 left-0 w-full h-full flex pointer-events-none z-0">
              {days.map((day, idx) => (
                <div key={idx} style={{ width: dayWidth }} className={`h-full border-r dark:border-white/5 shrink-0 ${day.isSame(dayjs(), 'day') ? 'bg-blue-500/[0.03]' : ''}`} />
              ))}
            </div>

            {/* Task Rows */}
            <div className="relative py-4 z-10">
              {scheduledCards.map((card) => {
                const sDate = dayjs(card.startDate);
                const eDate = dayjs(card.deadline || card.startDate);
                let left = sDate.diff(startDate, 'day') * dayWidth;
                let width = (eDate.diff(sDate, 'day') + 1) * dayWidth;

                const isDragging = dragState?.cardId === card.id && dragState.type !== 'sidebar-drag';
                
                if (isDragging && dragState) {
                   const diffX = dragState.currentX - dragState.startX;
                   if (dragState.type === 'move') {
                      left += diffX;
                   } else if (dragState.type === 'resize-left') {
                      left += diffX;
                      width -= diffX;
                   } else if (dragState.type === 'resize-right') {
                      width += diffX;
                   }
                }

                return (
                  <div key={card.id} className="h-[52px] relative flex items-center">
                    <div
                      onMouseDown={(e) => onInteractionStart(e, card, 'move')}
                      className={`
                        absolute h-10 rounded-xl shadow-md border flex items-center px-3 cursor-grab active:cursor-grabbing z-20
                        ${isDragging ? 'z-50 shadow-xl opacity-90 scale-[1.01] !transition-none' : 'transition-all'}
                        ${(card.priority || 0) >= 2 ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-blue-500/10 border-blue-500/30 text-blue-600'}
                      `}
                      style={{ 
                        left, 
                        width: Math.max(width, 40),
                      }}
                    >
                      <div className="absolute left-0 top-0 w-4 h-full cursor-ew-resize hover:bg-black/10 rounded-l-xl z-30" onMouseDown={(e) => onInteractionStart(e, card, 'resize-left')} />
                      <div className="absolute right-0 top-0 w-4 h-full cursor-ew-resize hover:bg-black/10 rounded-r-xl z-30" onMouseDown={(e) => onInteractionStart(e, card, 'resize-right')} />

                      <div className="flex items-center gap-2 min-w-0 pointer-events-none w-full">
                        <Avatar.Group max={{ count: 1 }} size="small" className="shrink-0">
                          {card.members?.map(m => <Avatar key={m.id} src={m.userAvatar} />)}
                        </Avatar.Group>
                        <Text strong className="truncate text-[10px] text-inherit flex-1">{card.title}</Text>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DRAG GHOST (For sidebar dragging) */}
      {dragState?.type === 'sidebar-drag' && (
        <div 
          className="fixed pointer-events-none z-[1000] w-64 p-3 bg-white dark:bg-[#2b2d31] border-2 border-blue-500 rounded-xl shadow-2xl opacity-90 scale-105"
          style={{ 
            left: dragState.currentX - 120, 
            top: dragState.currentY - 20,
          }}
        >
          <Text strong className="text-xs block mb-1 truncate">{cards[dragState.cardId]?.title}</Text>
          <div className="flex items-center justify-between">
             <Text className="text-[10px] text-blue-500 font-bold uppercase">Thả vào lịch để đặt ngày</Text>
             <PlusOutlined className="text-blue-500" />
          </div>
        </div>
      )}

      <CardDetailModal cardId={selectedCardId || ''} isOpen={!!selectedCardId} onClose={() => setSelectedCardId(null)} />
    </div>
  );
};

export default TimelineView;
