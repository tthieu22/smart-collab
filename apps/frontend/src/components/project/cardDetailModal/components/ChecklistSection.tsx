'use client';

import React from 'react';
import { Space, Input, Checkbox, Progress, Typography, theme } from 'antd';
import { CheckSquareOutlined, PlusOutlined } from '@ant-design/icons';
import type { ChecklistItem } from '@smart/types/project';

const { Text } = Typography;

interface Props {
  checklist: ChecklistItem[];
  newChecklistItem: string;
  setNewChecklistItem: (v: string) => void;
  addChecklistItem: () => void;
  toggleChecklist: (id: string) => void;
  progress: number;
}

const ChecklistSection: React.FC<Props> = ({
  checklist,
  newChecklistItem,
  setNewChecklistItem,
  addChecklistItem,
  toggleChecklist,
  progress,
}) => {
  const { token } = theme.useToken();

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          color: token.colorText,
        }}
      >
        <CheckSquareOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
        <Text strong style={{ color: token.colorText }}>
          Checklist ({progress}%)
        </Text>
        <Progress
          percent={progress}
          size="small"
          style={{ flex: 1, maxWidth: 150 }}
          strokeColor={token.colorPrimary}
          trailColor={token.colorFillQuaternary}
        />
      </div>

      <Space direction="vertical" style={{ width: '100%' }}>
        {checklist.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: item.done ? token.colorTextDisabled : token.colorText,
              textDecoration: item.done ? 'line-through' : 'none',
            }}
          >
            <Checkbox
              checked={item.done}
              onChange={() => toggleChecklist(item.id)}
              style={{ color: token.colorPrimary }}
            />
            <span>{item.title}</span>
          </div>
        ))}
        <Input
          placeholder="Thêm công việc..."
          value={newChecklistItem}
          onChange={e => setNewChecklistItem(e.target.value)}
          onPressEnter={addChecklistItem}
          suffix={<PlusOutlined style={{ color: token.colorTextDisabled }} />}
          style={{
            borderRadius: token.borderRadiusLG,
            fontFamily: 'Inter',
            fontSize: 14,
          }}
        />
      </Space>
    </div>
  );
};

export default ChecklistSection;
