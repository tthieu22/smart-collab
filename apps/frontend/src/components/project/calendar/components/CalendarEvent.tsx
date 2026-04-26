import React from 'react';
import { Avatar, Tooltip } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface CalendarEventProps {
    eventInfo: any;
    draggingCalendarCardId: string | null;
}

export const CalendarEvent: React.FC<CalendarEventProps> = ({
    eventInfo,
    draggingCalendarCardId,
}) => {
    const { event } = eventInfo;
    const card = event.extendedProps.card;
    const isDragging = draggingCalendarCardId === event.id;
    const isPreview = event.id === 'dragging-preview';

    if (isPreview) {
        return (
            <div className="flex items-center justify-center h-full text-[10px] font-medium text-blue-500 animate-pulse bg-blue-500/10 rounded-md border border-dashed border-blue-500/50">
                <ClockCircleOutlined className="mr-1" /> Thả để lên lịch
            </div>
        );
    }

    if (!card) return <div className="p-1 text-[10px] truncate">{event.title}</div>;

    const priorities = [
        { label: 'Thấp', color: '#52c41a' },
        { label: 'Trung bình', color: '#1890ff' },
        { label: 'Cao', color: '#fa8c16' },
        { label: 'Khẩn cấp', color: '#f5222d' },
    ];
    const prio = priorities[card.priority] || null;

    return (
        <div className={`
      p-2 h-full flex flex-col group/cal-event transition-all duration-200
      ${isDragging ? 'opacity-30 grayscale' : 'opacity-100'}
    `}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                    {prio && (
                        <div
                            className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
                            style={{ backgroundColor: prio.color }}
                        />
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-50 truncate">
                        {dayjs(event.start).format('HH:mm')}
                    </span>
                </div>
            </div>

            <div className="text-[11px] font-bold leading-tight mb-1 line-clamp-2 group-hover/cal-event:text-blue-500 transition-colors">
                {event.title}
            </div>

            {card.labels && card.labels.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mb-2 mt-auto">
                    {card.labels.map((l: any) => (
                        <Tooltip key={l.id} title={l.label}>
                            <div
                                className="h-1 w-3 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                style={{ backgroundColor: l.color || '#94A3B8' }}
                            />
                        </Tooltip>
                    ))}
                </div>
            )}

            {card.members && card.members.length > 0 && (
                <div className="flex justify-end pt-1 border-t border-gray-100/10">
                    <Avatar.Group
                        max={{ count: 2 }}
                        size="small"
                        className="scale-90 origin-right"
                    >
                        {card.members.map((m: any) => (
                            <Avatar key={m.userId} src={m.userAvatar} size={18} className="border-gray-200 dark:border-gray-700" />
                        ))}
                    </Avatar.Group>
                </div>
            )}
        </div>
    );
};
