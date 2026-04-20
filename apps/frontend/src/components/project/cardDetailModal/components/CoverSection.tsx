'use client';

import React, { useState } from 'react';
import { Button, Popover, Space, Typography, theme, Upload, message, Tooltip } from 'antd';
import { BgColorsOutlined, PictureOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useBoardStore } from '@smart/store/setting';
import { uploadService } from '@smart/services/upload.service';
import { projectStore } from '@smart/store/project';

const { Text } = Typography;

interface Props {
  coverUrl?: string | null;
  onUpdate: (data: any) => Promise<any>;
}

const CoverSection: React.FC<Props> = ({ coverUrl, onUpdate }) => {
  const { token } = theme.useToken();
  const { colors, images } = useBoardStore();
  const { currentProject } = projectStore();
  const [loading, setLoading] = useState(false);

  const handleSelectColor = async (color: string) => {
    try {
      await onUpdate({ coverUrl: color });
      message.success('Đã cập nhật màu nền');
    } catch (error) {
      message.error('Cập nhật thất bại');
    }
  };

  const handleSelectImage = async (imageUrl: string) => {
    try {
      await onUpdate({ coverUrl: imageUrl });
      message.success('Đã cập nhật ảnh nền');
    } catch (error) {
      message.error('Cập nhật thất bại');
    }
  };

  const handleUpload = async (file: File) => {
    if (!currentProject?.folderPath) {
      message.error('Không tìm thấy thư mục dự án');
      return false;
    }

    setLoading(true);
    try {
      const res = await uploadService.uploadFiles(currentProject.folderPath, [file]);
      if (res.success && res.data?.[0]) {
        const item = res.data[0];
        await onUpdate({
          coverUrl: item.url,
          coverPublicId: item.public_id,
          coverFilename: item.original_filename,
          coverFileSize: item.size,
        });
        message.success('Đã tải lên ảnh bìa');
      }
    } catch (error) {
      message.error('Tải lên thất bại');
    } finally {
      setLoading(false);
    }
    return false; // Prevent default upload
  };

  const handleRemove = async () => {
    try {
      await onUpdate({
        coverUrl: null,
        coverPublicId: null,
        coverFilename: null,
        coverFileSize: null,
      });
      message.success('Đã gỡ ảnh bìa');
    } catch (error) {
      message.error('Gỡ ảnh thất bại');
    }
  };

  const content = (
    <div className="w-[300px] p-2">
      <div className="mb-4">
        <Text strong className="mb-2 block text-xs uppercase text-gray-400">Màu sắc</Text>
        <div className="grid grid-cols-4 gap-2">
          {colors.map(color => (
            <div
              key={color}
              onClick={() => handleSelectColor(color)}
              className="h-8 rounded cursor-pointer hover:opacity-80 transition-opacity border border-gray-100 dark:border-neutral-700"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <Text strong className="mb-2 block text-xs uppercase text-gray-400">Hình nền có sẵn</Text>
        <div className="grid grid-cols-2 gap-2">
          {images.map(img => (
            <div
              key={img}
              onClick={() => handleSelectImage(img)}
              className="h-12 rounded cursor-pointer hover:opacity-80 transition-opacity bg-cover bg-center border border-gray-100 dark:border-neutral-700"
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
        </div>
      </div>

      <div>
        <Text strong className="mb-2 block text-xs uppercase text-gray-400">Tải lên từ máy tính</Text>
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleUpload}
          disabled={loading}
        >
          <Button icon={<UploadOutlined />} block loading={loading}>Tải ảnh lên</Button>
        </Upload>
      </div>

      {coverUrl && (
        <Button 
          danger 
          icon={<DeleteOutlined />} 
          block 
          className="mt-4"
          onClick={handleRemove}
        >
          Gỡ ảnh bìa
        </Button>
      )}
    </div>
  );

  const isColor = coverUrl?.startsWith('rgb') || coverUrl?.startsWith('#');

  return (
    <div className="relative w-full group">
      {coverUrl ? (
        <div 
          className="w-full h-[160px] relative transition-all duration-300 overflow-hidden"
          style={{ 
            backgroundColor: isColor ? coverUrl : 'transparent',
            backgroundImage: !isColor ? `url(${coverUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Popover content={content} title="Ảnh bìa" trigger="click" placement="bottom">
              <Button 
                ghost 
                icon={<PictureOutlined />} 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Thay đổi ảnh bìa
              </Button>
            </Popover>
          </div>
        </div>
      ) : (
        <Popover content={content} title="Ảnh bìa" trigger="click" placement="bottom">
          <Button 
            type="text" 
            icon={<PictureOutlined />} 
            className="mt-2 text-gray-500 hover:text-blue-500"
          >
            Thêm ảnh bìa
          </Button>
        </Popover>
      )}
    </div>
  );
};

export default CoverSection;
