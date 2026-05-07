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
      destroyOnHidden
      width={1100}
      centered
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center dark:bg-blue-500/20">
            <Camera size={20} className="text-blue-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-gray-800 dark:text-gray-100 m-0 leading-none">
              {UI_CONFIG.PHOTOBOOTH.TITLE}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest mt-1">
              {UI_CONFIG.PHOTOBOOTH.SUBTITLE}
            </p>
          </div>
        </div>
      }
      styles={{
        header: {
          padding: '16px 20px',
          marginBottom: 0,
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        },
        body: {
          padding: 0,
          height: '80vh',
          maxHeight: '800px',
          overflow: 'hidden',
          backgroundColor: '#000'
        },
        mask: {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(0,0,0,0.6)'
        },
        content: {
          borderRadius: '24px',
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
