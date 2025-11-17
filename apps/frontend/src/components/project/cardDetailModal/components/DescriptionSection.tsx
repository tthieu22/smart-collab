'use client';

import React, { useState, useEffect } from 'react';
import { Button, Skeleton, Progress, Typography, Input, theme } from 'antd';
import AIBorderWrapper from './AIBorderWrapper';
import AIIcon from './AIIcon';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  description: string;
  setDescription: (value: string) => void;
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
  const { token } = theme.useToken();

  // Local state giữ mô tả tạm thời khi nhập liệu
  const [localDescription, setLocalDescription] = useState(description);

  // Đồng bộ lại khi prop description thay đổi (ví dụ sau khi AI generate cập nhật)
  useEffect(() => {
    setLocalDescription(description);
  }, [description]);

  // Cập nhật local state khi người dùng nhập
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalDescription(e.target.value);
  };

  // Khi mất focus, cập nhật giá trị lên cha và gọi onBlur
  const handleBlur = () => {
    if (localDescription !== description) {
      setDescription(localDescription);
    }
    onBlur();
  };

  return (
    <AIBorderWrapper active={isGenerating}>
      <div
        style={{
          backgroundColor: token.colorBgContainer,
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
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            AI Generate
          </Button>
        </div>

        {/* Body */}
        {isGenerating ? (
          <>
            <Skeleton active paragraph={{ rows: 4 }} style={{ backgroundColor: token.colorBgContainer }} />
            <Progress
              percent={aiProgress}
              size="small"
              status="active"
              style={{ marginTop: 8 }}
              strokeColor={{
                '0%': '#ea4335',
                '100%': '#fbbc05',
              }}
            />
          </>
        ) : (
          <TextArea
            value={localDescription}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter description..."
            rows={8}
            style={{
              resize: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              lineHeight: 1.5,
              backgroundColor: token.colorBgContainer,
              color: token.colorText,
              borderColor: token.colorBorder,
              borderRadius: token.borderRadius,
              transition: 'border-color 0.3s ease',
            }}
          />
        )}
      </div>
    </AIBorderWrapper>
  );
};

export default DescriptionSection;
