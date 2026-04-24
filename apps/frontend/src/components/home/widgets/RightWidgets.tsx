'use client';

import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { useFeedStore } from '@smart/store/feed';
import { NewsPromoSideCard } from '@smart/components/news/NewsPromoSideCard';
import { TipsGuideSideCard } from '@smart/components/news/TipsGuideSideCard';
import { Users } from 'lucide-react';

export default function RightWidgets() {
  const postIds = useFeedStore((s) => s.postIds);
  const users = useFeedStore((s) => s.users);
  const posts = useFeedStore((s) => s.posts);

  const topAuthors = (() => {
    const score: Record<string, number> = {};
    postIds.forEach((pid) => {
      const p = posts[pid];
      if (!p) return;
      const total =
        (p.reactionSummary?.like || 0) +
        (p.reactionSummary?.love || 0) +
        (p.reactionSummary?.haha || 0) +
        (p.reactionSummary?.wow || 0) +
        (p.reactionSummary?.sad || 0) +
        (p.reactionSummary?.angry || 0);
      score[p.authorId] = (score[p.authorId] || 0) + total;
    });
    return Object.entries(score)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([uid]) => users[uid])
      .filter(Boolean);
  })();

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card
        padding="small"
        className="dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/10 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4 px-1">
          <Users className="w-4 h-4 text-blue-500" />
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Gợi ý theo dõi</div>
        </div>
        
        <div className="space-y-1">
          {topAuthors.length ? (
            topAuthors.map((u) => (
              <Link
                href={`/profile/${u.id}`}
                key={u.id}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors group"
              >
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white dark:border-neutral-800 shadow-sm ring-1 ring-black/5 group-hover:scale-105 transition-transform">
                  {u.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold">
                       {u.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {u.name}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    @{u.username}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-gray-500 p-4 text-center border border-dashed rounded-xl border-gray-200 dark:border-neutral-800">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </Card>

      <NewsPromoSideCard />

      <TipsGuideSideCard />
      
    </div>
  );
}
