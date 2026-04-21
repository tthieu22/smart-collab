'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { ChevronRight } from 'lucide-react';
import type { NewsArticle } from '@smart/types/ai-autopost';

interface NewsCardProps {
  article: NewsArticle;
  variant?: 'list' | 'grid';
  actions?: React.ReactNode;
}

export function NewsCard({ article, variant = 'list', actions }: NewsCardProps) {
  const thumb = article.media?.find((m) => m.type?.toLowerCase() === 'image') ?? article.media?.[0];
  const excerpt = article.content.replace(/\s+/g, ' ').trim();
  const excerptShort = excerpt.length > (variant === 'list' ? 180 : 100) ? `${excerpt.slice(0, variant === 'list' ? 180 : 100)}…` : excerpt;

  const isGrid = variant === 'grid';

  return (
    <Link href={`/news/${article.id}`} className="block group h-full">
      <Card
        padding="none"
        className={`dark:bg-neutral-950 dark:border-neutral-800 transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:border-blue-900 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 h-full ${isGrid ? 'flex flex-col' : ''}`}
      >
        <div className={`flex h-full ${isGrid ? 'flex-col' : 'p-3 gap-4'}`}>
          {/* Media Section */}
          <div className={`${isGrid ? 'w-full h-48' : 'h-24 w-24 shrink-0'} overflow-hidden bg-gray-100 dark:bg-neutral-900 ring-1 ring-black/5`}>
            {thumb?.url ? (
              thumb.type?.toLowerCase() === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb.url}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <video src={thumb.url} className="h-full w-full object-cover" muted />
              )
            ) : (
              <div className="h-full w-full flex items-center justify-center border border-dashed border-gray-200 dark:border-neutral-800">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Media</span>
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <div className={`min-w-0 flex-1 flex flex-col justify-between ${isGrid ? 'p-4' : 'py-0.5'}`}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  article.category === 'TIP' 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {article.category || 'NEWS'}
                </span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                  {article.createdAt ? new Date(article.createdAt).toLocaleDateString('vi-VN') : 'Mới'}
                </span>
              </div>
              
              <h3 className={`font-bold leading-tight text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${isGrid ? 'text-lg line-clamp-2' : 'text-base line-clamp-1'}`}>
                {article.title || 'Tin tức mới'}
              </h3>
              <p className="text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-2">
                {excerptShort || 'Bài không có nội dung'}
              </p>
            </div>

            <div className={`mt-4 flex items-center justify-between ${isGrid ? '' : ''}`}>
               <div className="flex items-center gap-2">
                  {article.linkUrl && (
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                      Link
                    </span>
                  )}
               </div>
               
               <span className="inline-flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  Đọc tiếp
                  <ChevronRight size={14} className="stroke-[3]" />
               </span>
            </div>

            {actions && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-900 flex items-center justify-end gap-1">
                {actions}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
