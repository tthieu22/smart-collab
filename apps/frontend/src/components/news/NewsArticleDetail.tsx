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
    ? new Date(article.createdAt).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : '';

  return (
    <article className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-900 pb-4">
        <Link
          href={backHref}
          className="group inline-flex items-center gap-2 text-sm font-black text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Danh sách tin
        </Link>

        <div className="flex items-center gap-2">
          {article.category === 'TIP' ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
              Mẹo & Hướng dẫn
            </span>
          ) : (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
              Tin tức
            </span>
          )}
        </div>
      </div>

      <header className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black leading-tight text-gray-900 dark:text-white tracking-tight">
          {article.title || 'Tin tức mới'}
        </h1>

        <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">A</div>
            <span>Đệ tthieu22</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-800" />
          <time dateTime={article.createdAt}>{dateLabel}</time>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <NewsLinkifiedContent
          text={article.content}
          className="whitespace-pre-wrap break-words text-lg leading-8 text-gray-800 dark:text-neutral-200 font-medium"
        />
      </div>

      {/* Media Gallery */}
      {media.length > 0 && (
        <div className="space-y-4">
          <div className={`grid gap-4 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {media.map((m) => (
              <figure key={m.id} className="group relative overflow-hidden rounded-3xl bg-gray-100 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-xl shadow-black/5">
                {m.type?.toLowerCase() === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.alt || 'Ảnh minh họa'}
                    className="w-full h-auto max-h-[600px] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <video src={m.url} controls className="w-full max-h-[600px] bg-black" />
                )}
                {m.alt && (
                  <figcaption className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center uppercase tracking-widest">
                    {m.alt}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* External Link */}
      {article.linkUrl?.trim() && (
        <div className="pt-8 border-t border-gray-100 dark:border-neutral-900">
          <div className="p-8 rounded-3xl bg-gray-50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800 flex flex-col items-center text-center gap-4">
            <div className="p-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm">
              <ExternalLink size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tìm hiểu thêm chi tiết</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Xem nguồn tin gốc hoặc tài liệu đính kèm bên dưới.</p>
            </div>
            <a
              href={article.linkUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-95"
            >
              Mở liên kết nguồn
            </a>
          </div>
        </div>
      )}
    </article>
  );
}
