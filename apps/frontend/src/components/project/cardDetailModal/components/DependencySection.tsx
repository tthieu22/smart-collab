'use client';

import React from 'react';
import { Space, Select, Typography, theme } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { projectStore } from '@smart/store/project';

const { Text } = Typography;

interface Props {
  dependencyId?: string | null;
  cardId: string;
  projectId: string;
  onChange: (id: string | null) => void;
}

const DependencySection: React.FC<Props> = ({ dependencyId, cardId, projectId, onChange }) => {
  const { token } = theme.useToken();
  const { cards, allProjects } = projectStore();
  const project = allProjects.find(p => p.id === projectId);
  const allCards = Object.values(cards).filter(c => c.projectId === projectId && c.id !== cardId);

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          color: token.colorText,
        }}
      >
        <LinkOutlined style={{ fontSize: 16, color: token.colorPrimary }} />
        <Text strong style={{ fontSize: 13 }}>Phụ thuộc vào (Dependency)</Text>
      </div>

      <Select
        placeholder="Chọn thẻ công việc trước đó..."
        style={{ width: '100%' }}
        allowClear
        value={dependencyId}
        onChange={(val) => onChange(val || null)}
        options={allCards.map(c => ({ label: c.title, value: c.id }))}
        size="small"
        className="custom-select-minimal"
      />
    </div>
  );
};

export default DependencySection;
