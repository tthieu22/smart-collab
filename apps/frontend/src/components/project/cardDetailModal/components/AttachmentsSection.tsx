'use client';

import React from 'react';
import { Space, Button, Upload, Typography, theme } from 'antd';
import { PaperClipOutlined, PlusOutlined } from '@ant-design/icons';
import type { Attachment } from '@smart/types/project';

const { Text } = Typography;

interface Props {
  attachments: Attachment[];
}

const AttachmentsSection: React.FC<Props> = ({ attachments }) => {
  const { token } = theme.useToken();

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          color: token.colorText,
        }}
      >
        <PaperClipOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
        <Text strong style={{ color: token.colorText }}>
          Attachments
        </Text>
      </div>

      <Space direction="vertical" style={{ width: '100%' }}>
        {attachments.map(file => (
          <div
            key={file.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: token.colorFillSecondary,
              borderRadius: token.borderRadiusLG,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: token.colorText }}>
              <PaperClipOutlined />
              <div>
                <Text strong style={{ color: token.colorText }}>
                  {file.name}
                </Text>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block', color: token.colorTextSecondary }}
                >
                  {file.size}
                </Text>
              </div>
            </div>
            <Button type="link" size="small">
              Download
            </Button>
          </div>
        ))}

        <Upload>
          <Button icon={<PlusOutlined />} style={{ borderRadius: token.borderRadiusLG }}>
            Upload File
          </Button>
        </Upload>
      </Space>
    </div>
  );
};

export default AttachmentsSection;
