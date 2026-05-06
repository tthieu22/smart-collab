'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { pickRandomNewsTips } from '@smart/lib/news-tips';
import { Lightbulb, Info, Sparkles } from 'lucide-react';
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
      padding="none"
      className="overflow-hidden border-gray-200 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5 shadow-sm rounded-[24px]"
    >
      <div className="p-4 border-b border-gray-100 dark:border-neutral-800/50 flex items-center justify-between bg-amber-50/30 dark:bg-amber-900/10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/40">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500/10" />
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Mẹo</div>
        </div>
        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
      </div>

      <div className="p-3 space-y-4">
        {tipArticles.length > 0 && (
          <div className="space-y-2">
            {tipArticles.map((a) => (
              <Link
                href={`/news/${a.id}`}
                key={a.id}
                className="flex gap-2.5 p-2.5 rounded-xl hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-all group border border-transparent hover:border-amber-100 dark:hover:border-amber-900/30"
              >
                <div className="mt-0.5 shrink-0">
                  <div className="h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Info size={10} className="text-blue-500" />
                  </div>
                </div>
                <div className="text-[11px] text-gray-600 dark:text-neutral-400 group-hover:text-gray-900 dark:group-hover:text-neutral-200 leading-relaxed font-medium line-clamp-3 transition-colors">
                  {a.content.replace(/\s+/g, ' ').trim()}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-3.5 border border-amber-100/50 dark:border-amber-900/20 relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
            <Lightbulb size={40} />
          </div>
          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-amber-500" />
            Nhắc nhở AI
          </div>
          <div className="space-y-2 relative z-10">
            {staticTips.map((t, i) => (
              <div key={i} className="text-[11px] text-amber-900/80 dark:text-amber-200/70 leading-relaxed font-medium italic">
                "{t}"
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

