'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { useFeedStore } from '@smart/store/feed';
import { NewsPromoSideCard } from '@smart/components/news/NewsPromoSideCard';
import { TipsGuideSideCard } from '@smart/components/news/TipsGuideSideCard';
import { Users, Search, Activity, Zap, ArrowRight, UserPlus } from 'lucide-react';
import { cn } from '@smart/lib/utils';
import { Button } from 'antd';

export default function RightWidgets() {
  const postIds = useFeedStore((s) => s.postIds);
  const users = useFeedStore((s) => s.users);
  const posts = useFeedStore((s) => s.posts);
  const currentUserId = useFeedStore((s) => s.currentUserId);

  const topAuthors = useMemo(() => {
    const score: Record<string, number> = {};
    postIds.forEach((pid) => {
      const p = posts[pid];
      if (!p) return;
      if (p.authorId === currentUserId) return; // Không gợi ý chính mình

      const total =
        (p.reactionSummary?.like || 0) +
        (p.reactionSummary?.love || 0) +
        (p.reactionSummary?.haha || 0) +
        (p.reactionSummary?.wow || 0) +
        (p.reactionSummary?.sad || 0) +
        (p.reactionSummary?.angry || 0);
      score[p.authorId] = (score[p.authorId] || 0) + total + (p.commentCount || 0) * 2;
    });

    return Object.entries(score)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([uid]) => users[uid])
      .filter(Boolean);
  }, [postIds, users, posts, currentUserId]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-1000 pb-10 pr-2">
      {/* Suggested Authors */}
      <Card
        padding="none"
        className="overflow-hidden bg-white/50 dark:bg-neutral-950/30 backdrop-blur-xl border-gray-200 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5 shadow-sm rounded-[24px]"
      >
        <div className="p-3 border-b border-gray-100 dark:border-neutral-800/50 flex items-center justify-between bg-gray-50/30 dark:bg-neutral-900/10">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span className="text-xs font-black tracking-tight text-gray-800 dark:text-gray-100 uppercase">Gợi ý cộng tác</span>
          </div>
          <Link href="/discovery" className="text-[10px] font-bold text-gray-400 hover:text-blue-500 transition-all uppercase tracking-wider">
            Tất cả
          </Link>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-neutral-800/20">
          {topAuthors.length ? (
            topAuthors.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-3.5 hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 transition-all group"
              >
                <Link href={`/profile/${u.id}`} className="relative h-10 w-10 shrink-0">
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="h-full w-full object-cover rounded-xl border border-white dark:border-neutral-800 shadow-sm transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-inner">
                      {u.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full shadow-sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${u.id}`} className="block text-xs font-bold text-gray-900 dark:text-gray-100 truncate hover:text-blue-500 transition-colors leading-tight">
                    {u.name}
                  </Link>
                  <div className="text-[10px] text-gray-400 dark:text-neutral-500 truncate mt-0.5 font-medium leading-none">
                    {u.username} • 24 dự án
                  </div>
                </div>
                <button className="h-8 w-8 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all ring-1 ring-blue-500/10">
                  <UserPlus size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="p-10 text-center flex flex-col items-center">
              <div className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-neutral-900 flex items-center justify-center mb-3">
                <Users size={20} className="text-gray-200 dark:text-neutral-800" />
              </div>
              <p className="text-[11px] font-medium text-gray-400 italic">Đang tìm cộng tác viên tài năng...</p>
            </div>
          )}
        </div>
      </Card>

      <NewsPromoSideCard />

      {/* Project Status Widget */}
      <Card
        padding="none"
        className="overflow-hidden border-none bg-slate-900 text-white relative group ring-1 ring-black/5 dark:ring-white/5 shadow-sm rounded-[24px]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20 opacity-50 group-hover:opacity-80 transition-opacity" />
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <Zap size={100} strokeWidth={1} />
        </div>
        <div className="p-5 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded-lg bg-white/10 flex items-center justify-center">
              <Activity size={12} className="text-blue-300" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">Team Velocity</span>
          </div>

          <div className="text-xl font-black tracking-tighter mb-1">94.2% Boost</div>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-5">
            Năng suất làm việc của team đã tăng vọt trong 7 ngày qua.
          </p>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                <span className="text-slate-400">Target Reached</span>
                <span className="text-blue-400">12 / 15</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-[80%] shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </div>
            </div>
            <Link href="/projects" className="flex items-center justify-center w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all gap-2 border border-white/5">
              Detailed Metrics <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </Card>

      <TipsGuideSideCard />
    </div>
  );
}
