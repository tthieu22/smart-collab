'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { theme as antdTheme, Tooltip, Avatar, Empty, Button, Typography, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Board as BoardType, Card } from '@smart/types/project';
import { projectStore } from '@smart/store/project';
import { useBoardStore } from '@smart/store/setting';
import CardDetailModal from '@smart/components/project/cardDetailModal/CardDetailModalById';
import { LeftOutlined, RightOutlined, UserOutlined } from '@ant-design/icons';

dayjs.extend(isBetween);

const { Text } = Typography;

interface Props {
  board: BoardType;
}

const TimelineView: React.FC<Props> = ({ board }) => {
  const { token } = antdTheme.useToken();
  const theme = useBoardStore((s) => s.theme);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Range state: Mặc định hiển thị 30 ngày xung quanh ngày hiện tại
  const [viewDate, setViewDate] = useState(dayjs());
  const daysToShow = 45; // Tổng số ngày hiển thị trong grid
  const dayWidth = 60; // Chiều rộng mỗi ô ngày (px)

  const { cards, columnCards, boardColumns } = projectStore();

  // Lấy tất cả card của board và có ngày tháng
  const boardCards = useMemo(() => {
    const columnIds = boardColumns[board.id] || [];
    const allCardIds = columnIds.flatMap((colId) => columnCards[colId] || []);
    return allCardIds
      .map((id) => cards[id])
      .filter((card): card is Card => Boolean(card && (card.startDate || card.deadline)))
      .sort((a, b) => dayjs(a.startDate || a.deadline).unix() - dayjs(b.startDate || b.deadline).unix());
  }, [board.id, boardColumns, columnCards, cards]);

  // Tính toán khoảng thời gian hiển thị
  const { startDate, days } = useMemo(() => {
    const start = viewDate.subtract(Math.floor(daysToShow / 3), 'day').startOf('day');
    const daysArr: Dayjs[] = [];
    for (let i = 0; i < daysToShow; i++) {
      daysArr.push(start.add(i, 'day'));
    }
    return { startDate: start, days: daysArr };
  }, [viewDate]);

  // Ref để đồng bộ scroll
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full p-4 select-none">
      {/* Header & Controls */}
      <div className="flex items-center justify-between mb-4 bg-white dark:bg-[#1e1f22]/80 backdrop-blur-xl p-3 rounded-xl border dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          {/* <Text strong className="text-lg">Timeline View</Text> */}
          <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-1 border dark:border-white/10">
            <Button
              type="text"
              size="small"
              icon={<LeftOutlined style={{ fontSize: 12 }} />}
              onClick={() => setViewDate(prev => prev.subtract(7, 'day'))}
            />
            <Text className="px-4 text-xs font-medium">
              {days[0].format('DD/MM')} - {days[days.length - 1].format('DD/MM/YYYY')}
            </Text>
            <Button
              type="text"
              size="small"
              icon={<RightOutlined style={{ fontSize: 12 }} />}
              onClick={() => setViewDate(prev => prev.add(7, 'day'))}
            />
          </div>
          <Button
            size="small"
            onClick={() => setViewDate(dayjs())}
            className="text-xs"
          >
            Hôm nay
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <Text type="secondary" className="text-[10px]">Đang thực hiện</Text>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <Text type="secondary" className="text-[10px]">Chưa có Deadline</Text>
          </div>
        </div>
      </div>

      {boardCards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#1e1f22]/80 rounded-xl border dark:border-white/10 shadow-sm">
          <Empty description="Chưa có thẻ nào có ngày bắt đầu hoặc ngày kết thúc" />
        </div>
      ) : (
        <div className={`
          flex-1 flex flex-col rounded-xl overflow-hidden border shadow-sm
          ${theme === 'dark' ? 'bg-[#1e1f22]/80 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}
        `}>
          {/* Calendar Header (Fixed) */}
          <div
            ref={headerRef}
            className="flex overflow-hidden border-b dark:border-white/10 bg-gray-50/50 dark:bg-white/5"
            style={{ marginLeft: 240 }}
          >
            {days.map((day) => {
              const isToday = day.isSame(dayjs(), 'day');
              const isWeekend = day.day() === 0 || day.day() === 6;
              return (
                <div
                  key={day.format('YYYY-MM-DD')}
                  className={`
                    flex-shrink-0 flex flex-col items-center justify-center h-16 border-r dark:border-white/5
                    ${isToday ? 'bg-blue-500/10' : ''}
                    ${isWeekend ? 'bg-gray-100/30 dark:bg-white/2' : ''}
                  `}
                  style={{ width: dayWidth }}
                >
                  <Text type="secondary" className="text-[10px] uppercase font-bold">
                    {day.format('ddd')}
                  </Text>
                  <Text className={`text-sm font-medium ${isToday ? 'text-blue-500' : ''}`}>
                    {day.format('D')}
                  </Text>
                </div>
              );
            })}
          </div>

          {/* Grid Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar (Task Names) */}
            <div className="w-[240px] flex-shrink-0 border-r dark:border-white/10 overflow-hidden flex flex-col bg-gray-50/30 dark:bg-white/2">
              <div className="flex-1 overflow-y-auto scrollbar-hide" onScroll={(e) => {
                if (gridRef.current) gridRef.current.scrollTop = e.currentTarget.scrollTop;
              }}>
                {boardCards.map(card => (
                  <div
                    key={card.id}
                    className="h-16 px-4 flex items-center border-b dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedCardId(card.id)}
                  >
                    <div className="flex flex-col min-w-0">
                      <Text strong className="text-xs truncate">{card.title}</Text>
                      <Text type="secondary" className="text-[10px] truncate">
                        {card.columnId ? projectStore.getState().columns[card.columnId]?.title : ''}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Grid */}
            <div
              ref={gridRef}
              className="flex-1 overflow-auto relative scroll-smooth"
              onScroll={handleScroll}
            >
              {/* Background Grid */}
              <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none flex">
                {days.map(day => (
                  <div
                    key={`grid-${day.format('YYYY-MM-DD')}`}
                    className={`
                      flex-shrink-0 h-full border-r dark:border-white/5
                      ${day.isSame(dayjs(), 'day') ? 'bg-blue-500/5' : ''}
                      ${(day.day() === 0 || day.day() === 6) ? 'bg-gray-50/30 dark:bg-white/1' : ''}
                    `}
                    style={{ width: dayWidth }}
                  />
                ))}
              </div>

              {/* Today Line */}
              {days.some(d => d.isSame(dayjs(), 'day')) && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-blue-500 z-10"
                  style={{
                    left: days.findIndex(d => d.isSame(dayjs(), 'day')) * dayWidth + (dayjs().hour() / 24) * dayWidth
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 -ml-[3.5px] mt-0" />
                </div>
              )}

              {/* Task Bars */}
              <div className="relative min-w-max pb-20">
                {boardCards.map((card) => {
                  const start = card.startDate ? dayjs(card.startDate) : dayjs(card.deadline).subtract(1, 'day');
                  const end = card.deadline ? dayjs(card.deadline) : dayjs(card.startDate).add(1, 'day');

                  // Tính vị trí left và width
                  const diffStart = start.diff(startDate, 'hour') / 24;
                  const duration = end.diff(start, 'hour') / 24 || 1; // Tối thiểu 1 ngày

                  const left = diffStart * dayWidth;
                  const width = duration * dayWidth;

                  // Kiểm tra xem bar có nằm trong khoảng hiển thị không
                  if (left + width < 0 || left > daysToShow * dayWidth) return null;

                  return (
                    <div
                      key={`bar-${card.id}`}
                      className="h-16 flex items-center relative"
                    >
                      <Tooltip title={`${card.title} (${start.format('DD/MM')} - ${end.format('DD/MM')})`}>
                        <div
                          onClick={() => setSelectedCardId(card.id)}
                          className={`
                            absolute h-8 rounded-lg shadow-sm cursor-pointer transition-all hover:scale-[1.02] flex items-center px-3 overflow-hidden
                            ${theme === 'dark'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/40'
                              : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                            }
                          `}
                          style={{
                            left,
                            width: Math.max(width, 20),
                            zIndex: 5
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {card.members && card.members.length > 0 && (
                              <Avatar
                                size={16}
                                src={card.members[0].userAvatar}
                                icon={<UserOutlined />}
                                className="flex-shrink-0"
                              />
                            )}
                            <span className="text-[10px] font-bold truncate">
                              {card.title}
                            </span>
                          </div>
                        </div>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <CardDetailModal
        cardId={selectedCardId || ''}
        isOpen={Boolean(selectedCardId)}
        onClose={() => setSelectedCardId(null)}
      />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default TimelineView;
