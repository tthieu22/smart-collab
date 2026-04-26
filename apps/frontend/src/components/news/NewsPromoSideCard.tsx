'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { useNewsStore } from '@smart/store/news';
import { useBoardStore } from '@smart/store/setting';
import { Newspaper, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@smart/lib/utils';

export function NewsPromoSideCard() {
  const { articles, fetchPublished, isInitialized } = useNewsStore();
  const { images: fallbackImages } = useBoardStore();

  useEffect(() => {
    if (!isInitialized) {
      fetchPublished({ limit: 4 });
    }
  }, [fetchPublished, isInitialized]);

  const previews = useMemo(() => {
    return articles.slice(0, 4).map((a) => {
      const oneLine = a.content.replace(/\s+/g, ' ').trim();

      // Get primary image from media
      const primaryImage = a.media && a.media.length > 0 ? a.media[0].url : null;

      // Pick a random fallback image based on ID index
      // We use the last char of ID to get a stable index
      const idCode = a.id.charCodeAt(a.id.length - 1) || 0;
      const fallbackIdx = idCode % fallbackImages.length;
      const fallbackUrl = fallbackImages[fallbackIdx];

      return {
        id: a.id,
        title: a.title || 'Tin tức',
        excerpt: oneLine.length > 60 ? `${oneLine.slice(0, 60)}…` : oneLine,
        imageUrl: primaryImage,
        fallbackUrl: fallbackUrl,
        date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }) : null
      };
    });
  }, [articles, fallbackImages]);

  return (
    <Card
      padding="none"
      className="overflow-hidden border-gray-200 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5 shadow-sm rounded-[24px]"
    >
      <div className="p-4 border-b border-gray-100 dark:border-neutral-800/50 flex items-center justify-between bg-emerald-50/30 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40">
            <Newspaper className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Tin mới nhất</div>
        </div>
        <Link
          href="/news"
          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 transition-colors"
        >
          Tất cả <ChevronRight size={10} />
        </Link>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-neutral-800/50">
        {previews.length ? (
          previews.map((p) => (
            <Link
              href={`/news/${p.id}`}
              key={p.id}
              className="group flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-all"
            >
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800">
                <NewsImage src={p.imageUrl} fallbackSrc={p.fallbackUrl} title={p.title} />
                {p.date && (
                  <div className="absolute top-1 left-1 bg-black/40 backdrop-blur-md text-[8px] text-white px-1.5 py-0.5 rounded-sm font-bold uppercase">
                    {p.date}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1">
                  {p.title}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-neutral-500 font-medium italic">
                  <Clock size={10} />
                  Top trending
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-8 text-center text-[11px] text-gray-400 italic">
            Đang cập nhật dòng sự kiện...
          </div>
        )}
      </div>
    </Card>
  );
}

function NewsImage({ src, fallbackSrc, title }: { src: string | null; fallbackSrc: string; title: string }) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [isError, setIsError] = useState(false);

  return (
    <img
      src={isError ? fallbackSrc : (src || fallbackSrc)}
      alt={title}
      className={cn(
        "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
        isError && "opacity-80"
      )}
      onError={() => {
        setIsError(true);
      }}
    />
  );
}

