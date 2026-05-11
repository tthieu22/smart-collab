'use client';

import React from 'react';
import { Modal, ConfigProvider, theme } from 'antd';
import { Camera } from 'lucide-react';
import { PhotoboothSystem } from './photobooth/PhotoboothSystem';
import { UI_CONFIG } from '@smart/lib/constants';

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ open, onClose, onCapture }) => {
  const { token } = theme.useToken();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      destroyOnHidden
      width="95vw"
      centered
      styles={{
        body: {
          padding: 0,
          height: '90vh',
          overflow: 'auto',
          backgroundColor: '#000'
        },
        mask: {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(0,0,0,0.6)'
        },
        content: {
          borderRadius: '32px',
          overflow: 'hidden',
          padding: 0,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }
      }}
    >
      {open && (
        <PhotoboothSystem
          onCapture={onCapture}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};
