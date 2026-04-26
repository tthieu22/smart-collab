'use client';

import React from 'react';
import { DatePicker, Space, Typography, theme, Button } from 'antd';
import dayjs from 'dayjs';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface Props {
  startDate?: string | null;
  deadline?: string | null;
  onChange: (dates: { startDate?: string | null; deadline?: string | null }) => void;
}

const DatesSection: React.FC<Props> = ({ startDate, deadline, onChange }) => {
  const { token } = theme.useToken();
  const [useTime, setUseTime] = React.useState(!!(startDate?.includes('T') || deadline?.includes('T')));

  const handleRangeChange = (dates: any) => {
    if (!dates) {
      onChange({ startDate: null, deadline: null });
      return;
    }
    onChange({
      startDate: dates[0] ? dates[0].toISOString() : null,
      deadline: dates[1] ? dates[1].toISOString() : null,
    });
  };

  const initialValues: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [
    startDate ? dayjs(startDate) : null,
    deadline ? dayjs(deadline) : null,
  ];

  const presets = [
    { label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
    { label: 'Tuần này', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
    { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Space align="center">
          <CalendarOutlined style={{ fontSize: 16, color: token.colorPrimary }} />
          <Text strong style={{ color: token.colorText }}>Thời gian</Text>
        </Space>

        {startDate && (
          <Button
            type="text"
            size="small"
            icon={<ClockCircleOutlined style={{ fontSize: 12, color: useTime ? token.colorPrimary : token.colorTextDisabled }} />}
            onClick={() => setUseTime(!useTime)}
            style={{ fontSize: 11, padding: '0 4px', height: 22, background: useTime ? `${token.colorPrimary}10` : 'transparent' }}
          >
            {useTime ? 'Đang bật giờ' : 'Thêm giờ'}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <RangePicker
          showTime={useTime}
          presets={presets as any}
          value={initialValues}
          onChange={handleRangeChange}
          placeholder={useTime ? ['Chọn ngày & giờ...', 'Chọn ngày & giờ...'] : ['Từ ngày...', 'Đến ngày...']}
          format={useTime ? 'HH:mm DD/MM/YYYY' : 'DD/MM/YYYY'}
          className="w-full"
          style={{
            borderRadius: 12,
            backgroundColor: (token as any).mode === 'dark' ? 'rgba(255,255,255,0.03)' : token.colorFillAlter,
            border: `1px solid ${token.colorBorderSecondary}`,
            padding: '8px 12px',
          }}
        />
      </div>
    </div>
  );
};

export default DatesSection;
