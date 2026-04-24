'use client';

import { Loading } from '@smart/components/ui/loading';

export default function GlobalLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full animate-pulse" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Đang chuẩn bị dữ liệu</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Vui lòng chờ trong giây lát...</p>
      </div>
    </div>
  );
}

