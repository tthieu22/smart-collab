'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { useNewsStore } from '@smart/store/news';
import { Newspaper, ChevronRight } from 'lucide-react';

export function NewsPromoSideCard() {
  const { articles, fetchPublished, isInitialized } = useNewsStore();

  useEffect(() => {
    if (!isInitialized) {
      fetchPublished({ limit: 3 });
    }
  }, [fetchPublished, isInitialized]);

  const previews = articles.slice(0, 3).map((a) => {
    const oneLine = a.content.replace(/\s+/g, ' ').trim();
    return {
      id: a.id,
      title: a.title || 'Tin tức',
      excerpt: oneLine.length > 80 ? `${oneLine.slice(0, 80)}…` : oneLine,
    };
  });

  return (
    <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-emerald-500" />
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Tin tức mới</div>
        </div>
        <Link
          href="/news"
          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5 transition-colors"
        >
          Tất cả <ChevronRight size={12} />
        </Link>
      </div>

      <div className="space-y-3">
        {previews.length ? (
          previews.map((p) => (
            <Link
              href={`/news/${p.id}`}
              key={p.id}
              className="block p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-neutral-800"
            >
              <div className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1 mb-1 italic">
                {p.title}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {p.excerpt}
              </div>
            </Link>
          ))
        ) : (
          <div className="py-4 text-center text-xs text-gray-400 border border-dashed rounded-xl border-gray-200 dark:border-neutral-800">
            Đang cập nhật tin tức...
          </div>
        )}
      </div>
    </Card>
  );
}
