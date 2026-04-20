'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, theme as antdTheme, Tooltip, ConfigProvider, theme as antdThemeFunc } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Board as BoardType } from '@smart/types/project';
import { projectStore } from '@smart/store/project';
import { useBoardStore } from '@smart/store/setting';
import CardDetailModal from '../cardDetailModal/CardDetailModalById';

interface Props {
  board: BoardType;
}

const CalendarView: React.FC<Props> = ({ board }) => {
  const { token } = antdTheme.useToken();
  const theme = useBoardStore((s) => s.theme);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const { cards, columnCards, boardColumns } = projectStore();

  const boardCards = useMemo(() => {
    const columnIds = boardColumns[board.id] || [];
    const allCardIds = columnIds.flatMap((colId) => columnCards[colId] || []);
    return allCardIds.map((id) => cards[id]).filter(Boolean);
  }, [board.id, boardColumns, columnCards, cards]);

  const getListData = (value: Dayjs) => {
    return boardCards.filter((card) => {
      const start = card.startDate ? dayjs(card.startDate).startOf('day') : null;
      const end = card.deadline ? dayjs(card.deadline).startOf('day') : null;
      
      if (start && end) {
        // Hiển thị nếu ngày hiện tại nằm trong khoảng [start, end]
        return (value.isSame(start) || value.isAfter(start)) && (value.isSame(end) || value.isBefore(end));
      }
      
      if (start) return start.isSame(value, 'day');
      if (end) return end.isSame(value, 'day');
      
      return false;
    });
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="list-none p-0 m-0 overflow-y-auto max-h-[80px] scrollbar-hide">
        {listData.map((item) => (
          <li key={item.id} className="mb-1">
            <Tooltip title={item.title}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCardId(item.id);
                }}
                className={`
                  text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer transition-all
                  ${theme === 'dark' 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/40' 
                    : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
                  }
                `}
              >
                {item.title}
              </div>
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdThemeFunc.darkAlgorithm : antdThemeFunc.defaultAlgorithm,
        token: {
          colorBgContainer: theme === 'dark' ? 'transparent' : '#fff',
        }
      }}
    >
      <div className={`flex-1 p-4 overflow-hidden flex flex-col h-full`}>
        <div className={`
          rounded-xl overflow-hidden border shadow-sm flex-1 flex flex-col
          ${theme === 'dark' ? 'bg-[#1e1f22]/80 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}
        `}>
          <Calendar
            fullscreen={true}
            cellRender={dateCellRender}
            className="h-full overflow-auto"
            headerRender={({ value, onChange }) => {
              return (
                <div className="flex items-center justify-between p-4 border-b dark:border-white/10">
                  <div className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {value.format('MMMM YYYY')}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onChange(value.clone().subtract(1, 'month'))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        theme === 'dark' 
                          ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                      }`}
                    >
                      Tháng trước
                    </button>
                    <button
                      onClick={() => onChange(dayjs())}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        theme === 'dark' 
                          ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30' 
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100'
                      }`}
                    >
                      Hôm nay
                    </button>
                    <button
                      onClick={() => onChange(value.clone().add(1, 'month'))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        theme === 'dark' 
                          ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                      }`}
                    >
                      Tháng sau
                    </button>
                  </div>
                </div>
              );
            }}
          />
        </div>

        <CardDetailModal
          cardId={selectedCardId || ''}
          isOpen={Boolean(selectedCardId)}
          onClose={() => setSelectedCardId(null)}
        />
      </div>
    </ConfigProvider>
  );
};

export default CalendarView;
