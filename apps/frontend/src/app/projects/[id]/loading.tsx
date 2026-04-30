'use client';

import React from 'react';
import { Skeleton } from 'antd';

export default function ProjectLoading() {
  return (
    <div className="flex h-screen w-full flex-col bg-white dark:bg-[#030303]">
      {/* Header Skeleton */}
      <div className="h-14 border-b border-gray-100 dark:border-neutral-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton.Button active size="small" shape="round" />
          <Skeleton.Input active size="small" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton.Avatar active size="small" />
          <Skeleton.Button active size="small" shape="round" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-4 flex gap-4 overflow-hidden">
        {/* Sidebar/List Skeleton */}
        <div className="w-80 hidden md:block">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>

        {/* Main Board Skeleton */}
        <div className="flex-1 flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-80 flex flex-col gap-3">
              <Skeleton.Button active block />
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 space-y-3 h-[500px]">
                <Skeleton active paragraph={{ rows: 3 }} />
                <Skeleton active paragraph={{ rows: 2 }} />
                <Skeleton active paragraph={{ rows: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
