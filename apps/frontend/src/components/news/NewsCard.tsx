'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';
import type { NewsArticle } from '@smart/types/ai-autopost';

interface NewsCardProps {
  article: NewsArticle;
  variant?: 'list' | 'grid';
  actions?: React.ReactNode;
}

export function NewsCard({ article, variant = 'list', actions }: NewsCardProps) {
  const thumb = article.media?.find((m) => m.type?.toLowerCase() === 'image') ?? article.media?.[0];
  const excerpt = article.content.replace(/\s+/g, ' ').trim();
  const isGrid = variant === 'grid';

  const excerptShort = excerpt.length > (isGrid ? 100 : 180)
    ? `${excerpt.slice(0, isGrid ? 100 : 180)}…`
    : excerpt;

  const content = (
    <div className={`group flex overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 isolation-auto z-0 ${isGrid ? 'flex-col h-full' : 'flex-row h-56'
      }`}>
      {/* Media Section */}
      <div className={`relative overflow-hidden z-0 ${isGrid ? 'h-40 w-full' : 'w-1/3 h-full shrink-0'
        }`}>
        {thumb?.url ? (
          thumb.type?.toLowerCase() === 'image' ? (
            <img
              src={thumb.url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <video src={thumb.url} className="h-full w-full object-cover" muted />
          )
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-neutral-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <span className={`absolute left-4 top-4 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-sm ${article.category === 'TIP'
          ? 'bg-amber-500/20 text-amber-100 border-amber-500/20'
          : 'bg-blue-500/20 text-blue-100 border-blue-500/20'
          }`}>
          {article.category || 'News'}
        </span>
      </div>

      {/* Content Section */}
      <div className={`flex flex-1 flex-col justify-between ${isGrid ? 'p-6' : 'p-8'}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            <Calendar size={12} />
            <span>{article.createdAt ? new Date(article.createdAt).toLocaleDateString('vi-VN') : 'Mới'}</span>
          </div>

          <h3 className={`font-bold leading-tight text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${isGrid ? 'text-lg line-clamp-2' : 'text-xl line-clamp-1'
            }`}>
            {article.title || 'Tin tức mới'}
          </h3>
          <p className={`text-gray-500 dark:text-neutral-400 font-medium ${isGrid ? 'text-sm line-clamp-2' : 'text-base line-clamp-2 leading-relaxed'
            }`}>
            {excerptShort || 'Bài không có nội dung'}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            Đọc tiếp
            <ChevronRight size={14} className="stroke-[3]" />
          </span>

          {actions && (
            <div className="flex items-center gap-1">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Link href={`/news/${article.id}`} className="block h-full">
      {content}
    </Link>
  );
}
