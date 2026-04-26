'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { newsService } from '@smart/services/news.service';
import { pickRandomNewsTips } from '@smart/lib/news-tips';
import type { NewsArticle } from '@smart/types/ai-autopost';
import { Lightbulb, Info } from 'lucide-react';

import { useNewsStore } from '@smart/store/news';

export function TipsGuideSideCard() {
  const { tipArticles, fetchTips, isTipsInitialized } = useNewsStore();
  const [staticTips, setStaticTips] = useState<string[]>([]);

  useEffect(() => {
    if (!isTipsInitialized) {
      fetchTips();
    }
  }, [fetchTips, isTipsInitialized]);

  useEffect(() => {
    setStaticTips(pickRandomNewsTips(1));
  }, []);

  return (
    <Card
      padding="small"
      className="dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/10 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4 px-1">
        <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500/10" />
        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Mẹo & hướng dẫn</div>
      </div>

      <div className="space-y-4">
        {tipArticles.length > 0 && (
          <div className="space-y-2">
            {tipArticles.map((a) => (
              <Link
                href={`/news/${a.id}`}
                key={a.id}
                className="flex gap-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors group border border-transparent hover:border-amber-100/50 dark:hover:border-amber-900/20"
              >
                <div className="mt-1">
                  <Info size={12} className="text-blue-500" />
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {a.content.replace(/\s+/g, ' ').trim()}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-3 border border-amber-100/50 dark:border-amber-900/20">
          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-2">
            Gợi ý nhanh
          </div>
          <ul className="space-y-2">
            {staticTips.map((t, i) => (
              <li key={i} className="text-[11px] text-amber-800/80 dark:text-amber-200/70 leading-relaxed flex gap-2">
                <span className="text-amber-400">•</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
