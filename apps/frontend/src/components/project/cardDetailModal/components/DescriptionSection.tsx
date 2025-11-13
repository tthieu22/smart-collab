'use client';

import React from 'react';
import { Button, Skeleton, Progress, Typography, Input, theme } from 'antd';
import AIBorderWrapper from './AIBorderWrapper';
import AIIcon from './AIIcon';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  description: string;
  setDescription: (v: string) => void;
  isGenerating: boolean;
  aiProgress: number;
  onAIGenerate: () => void;
  onBlur: () => void;
}

const DescriptionSection: React.FC<Props> = ({
  description,
  setDescription,
  isGenerating,
  aiProgress,
  onAIGenerate,
  onBlur,
}) => {
  // Lấy token từ theme để áp dụng màu động
  const { token } = theme.useToken();

  return (
    <AIBorderWrapper active={isGenerating}>
      <div
        style={{
          background: token.colorBgContainer,
          padding: 16,
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadowSecondary,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text strong style={{ fontSize: 16, color: token.colorText }}>
            Description
          </Text>

          <Button
            icon={<AIIcon />}
            onClick={onAIGenerate}
            loading={isGenerating}
            style={{
              background: 'linear-gradient(135deg, #ea4335, #fbbc05)',
              color: token.colorTextLightSolid,
              border: 'none',
              fontWeight: 'bold',
            }}
          >
            AI Generate
          </Button>
        </div>

        {/* Body */}
        {isGenerating ? (
          <div>
            <Skeleton
              active
              paragraph={{ rows: 4 }}
              style={{ background: token.colorBgContainer }}
            />
            <Progress
              percent={aiProgress}
              size="small"
              status="active"
              style={{ marginTop: 8 }}
            />
          </div>
        ) : (
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={onBlur}
            placeholder="Enter description..."
            rows={8}
            style={{
              resize: 'none',
              fontFamily: 'Inter',
              fontSize: 14,
              lineHeight: 1.5,
              background: token.colorBgContainer,
              color: token.colorText,
              borderColor: token.colorBorder,
              borderRadius: token.borderRadius,
            }}
          />
        )}
      </div>
    </AIBorderWrapper>
  );
};

export default DescriptionSection;
