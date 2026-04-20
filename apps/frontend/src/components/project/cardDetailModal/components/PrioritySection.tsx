'use client';

import React from 'react';
import { Select, Space, Typography, theme } from 'antd';
import { FlagOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  priority?: number | null;
  onChange: (priority: number) => void;
}

const priorities = [
  { value: 0, label: 'Thấp', color: '#52c41a' },
  { value: 1, label: 'Trung bình', color: '#1890ff' },
  { value: 2, label: 'Cao', color: '#fa8c16' },
  { value: 3, label: 'Khẩn cấp', color: '#f5222d' },
];

const PrioritySection: React.FC<Props> = ({ priority, onChange }) => {
  const { token } = theme.useToken();

  return (
    <div style={{ marginBottom: 24 }}>
      <Space align="center" style={{ marginBottom: 8 }}>
        <FlagOutlined style={{ fontSize: 16, color: token.colorTextSecondary }} />
        <Text strong style={{ color: token.colorText }}>Mức độ ưu tiên</Text>
      </Space>
      
      <div>
        <Select
          value={priority ?? 0}
          onChange={onChange}
          style={{ width: '100%', maxWidth: 200 }}
          options={priorities.map(p => ({
            value: p.value,
            label: (
              <Space>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color }} />
                <span>{p.label}</span>
              </Space>
            )
          }))}
          dropdownStyle={{ borderRadius: 8 }}
          placeholder="Chọn mức độ ưu tiên"
        />
      </div>
    </div>
  );
};

export default PrioritySection;
