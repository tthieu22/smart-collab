'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { newsService } from '@smart/services/news.service';

export function NewsPromoSideCard() {
  const [previews, setPreviews] = useState<{ id: string; excerpt: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    newsService
      .listPublished()
      .then((list) => {
        if (cancelled) return;
        setPreviews(
          list.slice(0, 3).map((a) => {
            const oneLine = a.content.replace(/\s+/g, ' ').trim();
            return {
              id: a.id,
              excerpt: oneLine.length > 100 ? `${oneLine.slice(0, 100)}…` : oneLine,
            };
          }),
        );
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
      <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Tin tức</div>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Bản tin AI / quản trị — tách khỏi bài đăng trên Home Feed.
      </p>
      <Link
        href="/news"
        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        Xem tất cả tin →
      </Link>
      {previews.length ? (
        <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-neutral-800">
          {previews.map((p) => (
            <li key={p.id}>
              <Link
                href={`/news/${p.id}`}
                className="line-clamp-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                {p.excerpt}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-gray-400">Chưa có tin hoặc chưa tải được.</p>
      )}
    </Card>
  );
}
