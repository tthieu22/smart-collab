'use client';

import React, { useState, useEffect } from 'react';
import { Space, Input, Checkbox, Progress, Typography, theme, Button } from 'antd';
import { CheckSquareOutlined, PlusOutlined, SyncOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ChecklistItem } from '@smart/types/project';

const { Text } = Typography;

interface Props {
  checklist: ChecklistItem[];
  newChecklistItem: string;
  setNewChecklistItem: (v: string) => void;
  addChecklistItem: () => void;
  toggleChecklist: (id: string) => void;
  removeChecklistItem: (id: string) => void;
  progress: number;
  onAiBreakdown?: () => void;
  loading?: boolean;
}

const ChecklistSection: React.FC<Props> = ({
  checklist,
  newChecklistItem,
  setNewChecklistItem,
  addChecklistItem,
  toggleChecklist,
  removeChecklistItem,
  progress,
  onAiBreakdown,
  loading = false,
}) => {
  const { token } = theme.useToken();

  // Dùng local state cho input, giảm số lần gọi setNewChecklistItem
  const [localNewItem, setLocalNewItem] = useState(newChecklistItem);

  useEffect(() => {
    setLocalNewItem(newChecklistItem);
  }, [newChecklistItem]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalNewItem(e.target.value);
  };

  const handleAdd = () => {
    if (localNewItem.trim()) {
      setNewChecklistItem(localNewItem.trim());
      addChecklistItem();
      setLocalNewItem('');
    }
  };

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
          Danh sách công việc ({progress}%)
        </Text>
        <Progress
          percent={progress}
          size="small"
          style={{ flex: 1, maxWidth: 150 }}
          strokeColor={token.colorPrimary}
          trailColor={token.colorFillQuaternary}
        />
        <Button 
          size="small" 
          type="text" 
          loading={loading}
          icon={!loading && <SyncOutlined />} 
          onClick={onAiBreakdown}
          style={{ color: '#2563eb', fontWeight: 600 }}
        >
          {loading ? 'Đang tạo...' : 'AI Phân rã'}
        </Button>
      </div>

      <Space direction="vertical" style={{ width: '100%' }}>
        {checklist.map(item => (
          <div
            key={item.id}
            className="group"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'space-between'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: item.done ? token.colorTextDisabled : token.colorText,
              textDecoration: item.done ? 'line-through' : 'none',
              flex: 1
            }}>
              <Checkbox
                checked={item.done}
                onChange={() => toggleChecklist(item.id)}
                style={{ color: token.colorPrimary }}
              />
              <span>{item.title}</span>
            </div>
            
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              onClick={() => removeChecklistItem(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        ))}

        <Input
          placeholder="Thêm công việc..."
          value={localNewItem}
          onChange={handleChange}
          onPressEnter={handleAdd}
          onKeyDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          suffix={<PlusOutlined style={{ color: token.colorTextDisabled }} />}
          style={{
            borderRadius: token.borderRadiusLG,
            fontSize: 14,
          }}
        />
      </Space>
    </div>
  );
};

export default ChecklistSection;
