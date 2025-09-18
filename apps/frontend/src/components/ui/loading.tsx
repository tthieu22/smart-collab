'use client';

import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingProps {
  size?: 'small' | 'default' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export function Loading({
  size = 'default',
  text = 'Đang tải...',
  fullScreen = false,
}: LoadingProps) {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        <div className="text-center">
          <Spin indicator={antIcon} size={size} />
          {text && <p className="mt-2 text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="text-center">
        <Spin indicator={antIcon} size={size} />
        {text && <p className="mt-2 text-gray-600">{text}</p>}
      </div>
    </div>
  );
}
