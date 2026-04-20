'use client';

import React from 'react';
import { DatePicker, Space, Typography, theme } from 'antd';
import dayjs from 'dayjs';
import { CalendarOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface Props {
  startDate?: string | null;
  deadline?: string | null;
  onChange: (dates: { startDate?: string | null; deadline?: string | null }) => void;
}

const DatesSection: React.FC<Props> = ({ startDate, deadline, onChange }) => {
  const { token } = theme.useToken();

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

  return (
    <div style={{ marginBottom: 24 }}>
      <Space align="center" style={{ marginBottom: 8 }}>
        <CalendarOutlined style={{ fontSize: 16, color: token.colorTextSecondary }} />
        <Text strong style={{ color: token.colorText }}>Thời gian thực hiện</Text>
      </Space>
      
      <div className="flex flex-wrap gap-4">
        <RangePicker
          showTime
          value={initialValues}
          onChange={handleRangeChange}
          placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
          className="w-full md:w-auto"
          style={{
            borderRadius: 8,
            backgroundColor: 'transparent',
            borderColor: token.colorBorder,
          }}
        />
      </div>
    </div>
  );
};

export default DatesSection;
