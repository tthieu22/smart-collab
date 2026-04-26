import React from 'react';
import {
    CalendarOutlined,
    LeftOutlined,
    RightOutlined,
    EllipsisOutlined,
    DownOutlined
} from '@ant-design/icons';
import { Button, Dropdown, DatePicker } from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

interface CalendarHeaderProps {
    currentDate: Date;
    viewMode: string;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    onDateChange: (date: Date) => void;
    onViewModeChange: (mode: string) => void;
    theme: 'light' | 'dark';
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentDate,
    viewMode,
    onPrev,
    onNext,
    onToday,
    onDateChange,
    onViewModeChange,
    theme,
}) => {
    const isDark = theme === 'dark';

    const viewOptions = [
        { value: 'timeGridDay', label: '1 Ngày' },
        { value: 'timeGridThreeDay', label: '3 Ngày' },
        { value: 'timeGridFiveDay', label: '5 Ngày' },
        { value: 'timeGridWeek', label: '7 Ngày' },
        { value: 'dayGridMonth', label: 'Tháng' },
        { value: 'listWeek', label: 'Danh sách' },
    ];

    const menuItems: MenuProps['items'] = [
        ...viewOptions.map(opt => ({
            key: opt.value,
            label: opt.label,
            onClick: () => onViewModeChange(opt.value),
            className: viewMode === opt.value ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600') : ''
        })),
        { type: 'divider' },
        {
            key: 'settings',
            label: 'Cài đặt lịch',
            icon: <EllipsisOutlined />,
        }
    ];

    return (
        <div className={`
            flex items-center justify-between px-3 py-1 border-b h-12 transition-colors duration-200
            ${isDark ? 'border-white/5 bg-[#1e1f22]' : 'border-gray-200 bg-white'}
        `}>
            {/* Left side: Month trigger (using compact DatePicker) */}
            <div className="flex items-center gap-1 relative">
                <DatePicker
                    value={dayjs(currentDate)}
                    onChange={(date) => {
                        if (date) onDateChange(date.toDate());
                    }}
                    picker="date"
                    allowClear={false}
                    suffixIcon={null}
                    inputReadOnly
                    className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div className={`
                    flex items-center gap-2 px-2 py-1.5 rounded-md transition-all group
                    ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}
                `}>
                    <CalendarOutlined className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'} group-hover:text-blue-500`} />
                    <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {dayjs(currentDate).format('MMMM')}
                    </span>
                    <DownOutlined className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
            </div>

            {/* Center side: Nav group (Compact) */}
            <div className={`
                flex items-center p-0.5 rounded-lg border
                ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200'}
            `}>
                <Button
                    type="text"
                    icon={<LeftOutlined className="text-[10px]" />}
                    size="small"
                    onClick={onPrev}
                    className={`
                        w-7 h-7 flex items-center justify-center rounded-md border-r
                        ${isDark ? 'hover:bg-white/10 text-gray-400 border-white/5' : 'hover:bg-white/50 text-gray-600 border-gray-200'}
                    `}
                />

                <Button
                    type="text"
                    size="small"
                    onClick={onToday}
                    className={`
                        px-3 h-7 font-bold text-[11px] rounded-none
                        ${isDark ? 'hover:bg-blue-500/10 hover:text-blue-400 text-gray-300' : 'hover:bg-blue-50 hover:text-blue-600 text-gray-700'}
                    `}
                >
                    Today
                </Button>

                <Button
                    type="text"
                    icon={<RightOutlined className="text-[10px]" />}
                    size="small"
                    onClick={onNext}
                    className={`
                        w-7 h-7 flex items-center justify-center rounded-md border-l
                        ${isDark ? 'hover:bg-white/10 text-gray-400 border-white/5' : 'hover:bg-white/50 text-gray-600 border-gray-200'}
                    `}
                />
            </div>

            {/* Right side: Dots */}
            <div className="flex items-center">
                <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                    <Button
                        type="text"
                        icon={<EllipsisOutlined className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />}
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                    />
                </Dropdown>
            </div>
        </div>
    );
};
