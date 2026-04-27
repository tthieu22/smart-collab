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

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'Mới';
    let date: Date;
    if (Array.isArray(dateInput)) {
      date = new Date(dateInput[0], (dateInput[1] || 1) - 1, dateInput[2] || 1, dateInput[3] || 0, dateInput[4] || 0);
    } else {
      date = new Date(dateInput);
    }
    return isNaN(date.getTime()) ? 'Mới' : date.toLocaleDateString('vi-VN');
  };

  const content = (
    <div className={`group relative flex overflow-hidden rounded-[24px] border border-gray-100 bg-white/50 backdrop-blur-xl transition-all duration-500 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950 ring-1 ring-black/5 dark:ring-white/5 ${isGrid ? 'flex-col h-full' : 'flex-row min-h-[220px]'
      }`}>
      {/* Media Section */}
      <div className={`relative overflow-hidden z-0 ${isGrid ? 'h-48 w-full' : 'w-1/3 h-full shrink-0'
        }`}>
        {thumb?.url ? (
          <img
            src={thumb.url}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-neutral-900 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse" />
            <span className="relative text-[10px] font-black text-gray-400 uppercase tracking-widest">Smart Discovery</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-40 group-hover:opacity-20 transition-opacity duration-700" />

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          <span className={`rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] border backdrop-blur-md shadow-lg ${article.category === 'TIP'
            ? 'bg-amber-500/20 text-amber-100 border-amber-500/20'
            : 'bg-indigo-500/20 text-indigo-100 border-indigo-500/20'
            }`}>
            {article.category || 'Discovery'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className={`flex flex-1 flex-col justify-between ${isGrid ? 'p-4' : 'p-5'}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 rounded-lg">
              <Calendar size={10} strokeWidth={3} />
              <span>{formatDate(article.createdAt)}</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-neutral-700" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">5 min read</span>
          </div>

          <h3 className={`font-bold leading-tight text-gray-900 dark:text-gray-100 mb-2.5 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isGrid ? 'text-[16px] line-clamp-2' : 'text-lg line-clamp-2'
            }`}>
            {article.title || 'Untitled Discovery'}
          </h3>
          <p className={`text-gray-800 dark:text-gray-200 font-medium leading-relaxed mb-4 ${isGrid ? 'text-[13px] line-clamp-2' : 'text-[15px] line-clamp-3'
            }`}>
            {excerptShort || 'No summary available for this item.'}
          </p>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 group/btn">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] transition-all group-hover/btn:mr-1">
              Explore Story
            </span>
            <div className="h-7 w-7 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 transition-all group-hover/btn:bg-blue-600 group-hover/btn:text-white">
              <ChevronRight size={14} strokeWidth={3} />
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-2">
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
