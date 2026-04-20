'use client';

import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { NewsLinkifiedContent } from '@smart/components/news/NewsLinkifiedContent';
import type { NewsArticle } from '@smart/types/ai-autopost';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export function NewsArticleDetail({
  article,
  backHref = '/news',
}: {
  article: NewsArticle;
  backHref?: string;
}) {
  const media = article.media ?? [];
  const dateLabel = article.createdAt
    ? new Date(article.createdAt).toLocaleString('vi-VN')
    : '';

  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ArrowLeft size={18} />
        Quay lại danh sách
      </Link>

      <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {article.category === 'TIP' ? (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Mẹo &amp; hướng dẫn
            </span>
          ) : (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              Tin tức
            </span>
          )}
          {dateLabel ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">{dateLabel}</span>
          ) : null}
        </div>

        <h1 className="mb-4 text-xl font-bold leading-tight text-gray-900 dark:text-gray-100">
          {article.title || 'Tin tức mới'}
        </h1>

        <NewsLinkifiedContent
          text={article.content}
          className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-800 dark:text-gray-100"
        />

        {media.length > 0 ? (
          <div
            className={`mt-4 grid gap-2 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}
          >
            {media.map((m) => (
              <div
                key={m.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900"
              >
                {m.type?.toLowerCase() === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.alt || 'Ảnh bài viết'}
                    className="max-h-[420px] w-full object-cover"
                  />
                ) : (
                  <video src={m.url} controls className="w-full max-h-[420px] bg-black" />
                )}
              </div>
            ))}
          </div>
        ) : null}

        {article.linkUrl?.trim() ? (
          <div className="mt-6 border-t border-gray-100 pt-4 dark:border-neutral-800">
            <a
              href={article.linkUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-neutral-800"
            >
              <ExternalLink size={16} />
              Mở liên kết đính kèm
            </a>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
