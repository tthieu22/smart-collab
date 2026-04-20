'use client';

import React, { useState, useEffect } from 'react';
import { Input, Typography, theme } from 'antd';

const { Title } = Typography;

interface Props {
  title: string;
  setTitle: (v: string) => void;
  editingTitle: boolean;
  setEditingTitle: (v: boolean) => void;
  onBlur: (updatedTitle: string) => void;
}

const TitleSection: React.FC<Props> = ({
  title,
  setTitle,
  editingTitle,
  setEditingTitle,
  onBlur,
}) => {
  const { token } = theme.useToken();

  // Local state giữ giá trị edit
  const [localTitle, setLocalTitle] = useState(title);

  // Đồng bộ khi prop title thay đổi (ví dụ khi load xong hoặc update từ backend)
  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const handleBlur = () => {
    setTitle(localTitle.trim());
    onBlur(localTitle);
    setEditingTitle(false);
  };

  return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {editingTitle ? (
          <Input
            value={localTitle}
            onChange={e => setLocalTitle(e.target.value)}
            onBlur={handleBlur}
            onPressEnter={e => e.currentTarget.blur()}
            autoFocus
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              border: 'none',
              padding: 0,
              color: token.colorText,
              backgroundColor: token.colorBgContainer,
              borderRadius: token.borderRadius,
            }}
          />
        ) : (
          <>
            <Title
              level={3}
              style={{
                margin: 0,
                flex: 1,
                cursor: 'pointer',
                color: token.colorText,
              }}
              onClick={() => setEditingTitle(true)}
            >
              {title || 'Untitled Card'}
            </Title>
          </>
        )}
      </div>
  );
};

export default TitleSection;
