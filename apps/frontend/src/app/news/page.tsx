'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import RightWidgets from '@smart/components/home/widgets/RightWidgets';
import { Loading } from '@smart/components/ui/loading';
import { Card } from '@smart/components/ui/card';
import { newsService } from '@smart/services/news.service';
import type { NewsArticle } from '@smart/types/ai-autopost';
import { ChevronRight } from 'lucide-react';

export default function NewsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    newsService
      .listPublished()
      .then(setArticles)
      .catch(() => setError('Không thể tải danh sách tin tức'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <Loading fullScreen text="Đang tải tin tức..." />;
  }

  return (
    <SiteLayout leftSidebar={<LeftWidgets />} rightSidebar={<RightWidgets />}>
      <div className="mx-auto w-full max-w-[680px] space-y-4">
        <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
          <h1 className="text-lg font-semibold">Tin tức</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kênh bản tin — mở từng bài để xem đầy đủ ảnh và liên kết.
          </p>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </Card>

        <div className="space-y-3">
          {articles.length === 0 ? (
            <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có tin nào.</p>
            </Card>
          ) : (
            articles.map((article) => {
              const thumb = article.media?.find((m) => m.type === 'image') ?? article.media?.[0];
              const excerpt = article.content.replace(/\s+/g, ' ').trim();
              const excerptShort = excerpt.length > 180 ? `${excerpt.slice(0, 180)}…` : excerpt;

              return (
                <Link key={article.id} href={`/news/${article.id}`} className="block">
                  <Card
                    padding="small"
                    className="dark:bg-neutral-950 dark:border-neutral-800 transition hover:border-blue-200 hover:shadow-sm dark:hover:border-blue-900"
                  >
                    <div className="flex gap-3">
                      {thumb?.url ? (
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-900">
                          {thumb.type === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <video src={thumb.url} className="h-full w-full object-cover" muted />
                          )}
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
                          {excerptShort || 'Bài không có nội dung'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          {article.createdAt
                            ? new Date(article.createdAt).toLocaleString('vi-VN')
                            : null}
                          {article.linkUrl ? (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-neutral-800">
                              Có liên kết
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-0.5 font-medium text-blue-600 dark:text-blue-400">
                            Đọc tiếp
                            <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
