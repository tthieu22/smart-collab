'use client';

import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { useFeedStore } from '@smart/store/feed';

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
    <>
      <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
        <div className="text-sm font-semibold mb-2">Gợi ý theo dõi</div>
        <div className="space-y-3">
          {topAuthors.length ? (
            topAuthors.map((u) => (
              <Link href={`/profile/${u.id}`} key={u.id} className="flex items-center gap-3 rounded-lg p-1 hover:bg-gray-50 dark:hover:bg-neutral-900">
                <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800">
                  {u.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatarUrl} alt={u.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-xs text-gray-500 truncate">@{u.username}</div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-gray-500">Chưa có dữ liệu</div>
          )}
        </div>
      </Card>

      <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
        <div className="text-sm font-semibold mb-2">Tips</div>
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <div>- Like/Comment/Share đang chạy local bằng Zustand.</div>
          <div>- Thay JSON bằng API: chỉ cần gọi `bootstrap()` với dataset từ backend.</div>
        </div>
      </Card>
    </>
  );
}

