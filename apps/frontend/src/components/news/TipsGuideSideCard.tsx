'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { BulbOutlined } from '@ant-design/icons';
import { newsService } from '@smart/services/news.service';
import { pickRandomNewsTips } from '@smart/lib/news-tips';
import type { NewsArticle } from '@smart/types/ai-autopost';

/**
 * Sidebar phải: mẹo từ bài category TIP (API) + gợi ý ngẫu nhiên từ danh sách tĩnh.
 */
export function TipsGuideSideCard() {
  const [tipArticles, setTipArticles] = useState<NewsArticle[]>([]);
  const [staticTips, setStaticTips] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    newsService
      .listTips()
      .then((list) => {
        if (!cancelled) setTipArticles(list.slice(0, 8));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setStaticTips(pickRandomNewsTips(1));
  }, []);

  return (
    <Card
      padding="small"
      className="dark:bg-neutral-950 dark:border-neutral-800"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <BulbOutlined className="text-amber-500" />
        <span>Mẹo &amp; hướng dẫn</span>
      </div>

      {tipArticles.length > 0 ? (
        <div className="mb-4 space-y-2 border-b border-gray-100 pb-3 dark:border-neutral-800">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Bài mẹo (danh mục TIP)
          </div>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
            {tipArticles.map((a) => (
              <li key={a.id} className="leading-snug">
                <Link
                  href={`/news/${a.id}`}
                  className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                >
                  {a.content.replace(/\s+/g, ' ').trim().slice(0, 200)}
                  {a.content.length > 200 ? '…' : ''}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Gợi ý nhanh
      </div>
      <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-gray-600 dark:text-gray-300">
        {staticTips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </Card>
  );
}
