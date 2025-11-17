'use client';

import React, { useState, useEffect } from 'react';
import { Input, Button, Skeleton, Progress, Typography, theme } from 'antd';
import AIBorderWrapper from './AIBorderWrapper';
import AIIcon from './AIIcon';

const { Title } = Typography;

interface Props {
  title: string;
  setTitle: (v: string) => void;
  editingTitle: boolean;
  setEditingTitle: (v: boolean) => void;
  isGenerating: boolean;
  aiProgress: number;
  onAIGenerate: () => void;
  onBlur: () => void;
}

const TitleSection: React.FC<Props> = ({
  title,
  setTitle,
  editingTitle,
  setEditingTitle,
  isGenerating,
  aiProgress,
  onAIGenerate,
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
    onBlur();
    setEditingTitle(false);
  };

  return (
    <AIBorderWrapper active={isGenerating}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isGenerating ? (
          <div style={{ flex: 1 }}>
            <Skeleton.Input active style={{ width: '100%', height: 32, borderRadius: token.borderRadius }} />
            <Progress
              percent={aiProgress}
              size="small"
              showInfo={false}
              style={{ marginTop: 8 }}
              strokeColor={token.colorPrimary}
            />
          </div>
        ) : editingTitle ? (
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
            <Button
              icon={<AIIcon />}
              onClick={onAIGenerate}
              loading={isGenerating}
              style={{
                background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorSuccess})`,
                color: token.colorTextLightSolid,
                border: 'none',
                fontWeight: 'bold',
              }}
            >
              AI Title
            </Button>
          </>
        )}
      </div>
    </AIBorderWrapper>
  );
};

export default TitleSection;
