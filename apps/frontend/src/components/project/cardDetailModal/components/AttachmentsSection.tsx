'use client';

import React from 'react';
import { Space, Button, Upload, Typography, theme, message, Tooltip } from 'antd';
import { PaperClipOutlined, PlusOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Attachment } from '@smart/types/project';

const { Text } = Typography;

interface Props {
  attachments: Attachment[];
  onAddAttachment: (file: File) => Promise<any>;
  onRemoveAttachment: (attachmentId: string) => Promise<any>;
  loading?: boolean;
}

const AttachmentsSection: React.FC<Props> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  loading = false,
}) => {
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
            <div style={{ display: 'flex', gap: 4 }}>
              <Tooltip title="Tải xuống">
                <Button
                  type="text"
                  size="small"
                  href={file.url}
                  target="_blank"
                  icon={<DownloadOutlined style={{ fontSize: 16 }} />}
                  className="flex items-center justify-center hover:bg-blue-50 text-blue-500"
                />
              </Tooltip>
              <Tooltip title="Xóa">
                <Button
                  danger
                  type="text"
                  size="small"
                  icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                  className="flex items-center justify-center hover:bg-red-50"
                  onClick={async () => {
                    try {
                      await onRemoveAttachment(file.id);
                      message.success('Đã xóa file');
                    } catch (e: any) {
                      message.error(e?.message || 'Xóa file thất bại');
                    }
                  }}
                />
              </Tooltip>
            </div>
          </div>
        ))}

        <Upload
          showUploadList={false}
          beforeUpload={(file) => {
            onAddAttachment(file as File).catch((e: any) =>
              message.error(e?.message || 'Upload thất bại')
            );
            return false;
          }}
        >
          <Button loading={loading} icon={<PlusOutlined />} style={{ borderRadius: token.borderRadiusLG }}>
            Upload File
          </Button>
        </Upload>
      </Space>
    </div>
  );
};

export default AttachmentsSection;
