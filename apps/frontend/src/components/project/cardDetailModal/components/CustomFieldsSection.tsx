'use client';

import React from 'react';
import { Space, Typography, theme, Tag, Input } from 'antd';
import { TableOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface CustomFieldValue {
  id: string;
  fieldId: string;
  value: string;
  field: {
    name: string;
    type: string;
  };
}

interface Props {
  values: CustomFieldValue[];
  onUpdate?: (fieldId: string, value: string) => void;
}

const CustomFieldsSection: React.FC<Props> = ({ values, onUpdate }) => {
  const { token } = theme.useToken();

  if (!values || values.length === 0) return null;

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
        <TableOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
        <Text strong style={{ color: token.colorText }}>
          Custom Fields
        </Text>
      </div>

      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {values.map((val) => (
          <div key={val.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="flex flex-col">
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                {val.field.name}
              </Text>
              <Input 
                defaultValue={val.value}
                onBlur={(e) => onUpdate?.(val.fieldId, e.target.value)}
                size="small"
                className="bg-transparent border-none px-0 hover:bg-neutral-100 dark:hover:bg-white/5"
              />
            </div>
            <Tag color="blue">{val.field.type}</Tag>
          </div>
        ))}
      </Space>
    </div>
  );
};

export default CustomFieldsSection;
