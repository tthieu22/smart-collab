'use client';

import React from 'react';
import { Pagination } from 'antd';

interface PremiumPaginationProps {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
    showSizeChanger?: boolean;
    className?: string;
    align?: 'left' | 'center' | 'right';
}

export function PremiumPagination({
    current,
    total,
    pageSize,
    onChange,
    showSizeChanger = false,
    className = "",
    align = 'center'
}: PremiumPaginationProps) {
    if (total <= pageSize) return null;

    return (
        <div className={`flex w-full pt-8 border-t border-gray-100 dark:border-neutral-800 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'
            }`}>
            <Pagination
                current={current}
                total={total}
                pageSize={pageSize}
                onChange={onChange}
                showSizeChanger={showSizeChanger}
                className={`premium-pagination ${className}`}
            />

            <style jsx global>{`
        .premium-pagination .ant-pagination-item {
          border-radius: 12px !important;
          border: 1px solid #e5e7eb !important;
          background: white !important;
          font-weight: 600 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.3s !important;
        }
        .dark .premium-pagination .ant-pagination-item {
          background: #171717 !important;
          border-color: #262626 !important;
        }
        .premium-pagination .ant-pagination-item-active {
          border-color: #3b82f6 !important;
          background: #3b82f6 !important;
        }
        .premium-pagination .ant-pagination-item-active a {
          color: white !important;
        }
        .dark .premium-pagination .ant-pagination-item a {
          color: #a3a3a3 !important;
        }
        .dark .premium-pagination .ant-pagination-item-active a {
          color: white !important;
        }
        .premium-pagination .ant-pagination-prev, 
        .premium-pagination .ant-pagination-next {
          border-radius: 12px !important;
          transition: all 0.3s !important;
        }
        .premium-pagination .ant-pagination-item:hover {
          border-color: #3b82f6 !important;
        }
        .dark .premium-pagination .ant-pagination-item:hover {
          border-color: #3b82f6 !important;
          background: #1e1e1e !important;
        }
        .premium-pagination .ant-pagination-disabled .ant-pagination-item-link {
          opacity: 0.5 !important;
        }
      `}</style>
        </div>
    );
}
