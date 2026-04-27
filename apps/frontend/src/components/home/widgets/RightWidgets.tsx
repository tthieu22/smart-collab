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
import { useAnalytics } from '@smart/hooks/useAnalytics';
import { projectStore } from '@smart/store/project';
import { useUserStore } from '@smart/store/user';

export default function RightWidgets() {
  const postIds = useFeedStore((s) => s.postIds);
  const users = useFeedStore((s) => s.users);
  const posts = useFeedStore((s) => s.posts);
  const currentUserId = useFeedStore((s) => s.currentUserId);

  const suggestedUsers = useUserStore((s) => s.suggestedUsers);
  const setSuggestedUsers = useUserStore((s) => s.setSuggestedUsers);

  const activeProjectId = projectStore((s) => s.activeProjectId);
  const { data: stats, isLoading: statsLoading } = useAnalytics({ teamId: activeProjectId });

  const isTeamMode = stats?.isTeamMode ?? false;
  const boost = stats?.boost ?? 0;
  const completed = stats?.completed ?? 0;
  const target = stats?.target ?? 1; // avoid div by zero
  const progress = Math.min((completed / target) * 100, 100);

  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Chỉ fetch nếu chưa có dữ liệu trong store
      if (suggestedUsers.length > 0) return;

      setSuggestionsLoading(true);
      try {
        const { userService } = await import('@smart/services/user.service');
        const res = await userService.getSuggestions();
        if (res.success) {
          setSuggestedUsers(res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
      } finally {
        setSuggestionsLoading(false);
      }
    };
    fetchSuggestions();
  }, [suggestedUsers.length, setSuggestedUsers]);

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
          {suggestionsLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
                  <div className="flex-1 space-y-2 mt-1">
                    <div className="h-3 bg-gray-100 dark:bg-neutral-800 rounded w-2/3" />
                    <div className="h-2 bg-gray-50 dark:bg-neutral-900 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedUsers.length ? (
            suggestedUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-3.5 hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 transition-all group"
              >
                <Link href={`/profile/${u.id}`} className="relative h-10 w-10 shrink-0">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="h-full w-full object-cover rounded-xl border border-white dark:border-neutral-800 shadow-sm transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-inner">
                      {u.name?.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full shadow-sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${u.id}`} className="block text-xs font-bold text-gray-900 dark:text-gray-100 truncate hover:text-blue-500 transition-colors leading-tight">
                    {u.name}
                  </Link>
                  <div className="text-[10px] text-gray-400 dark:text-neutral-500 truncate mt-0.5 font-medium leading-none">
                    @{u.username} • {Math.floor(Math.random() * 20) + 1} dự án
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

      {/* Project Status Widget (Dynamic) */}
      <Card
        padding="none"
        className={cn(
          "overflow-hidden border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white relative group ring-1 ring-black/5 dark:ring-white/5 shadow-sm rounded-[24px] transition-all duration-500",
          isTeamMode ? "bg-white dark:bg-slate-950" : "bg-white dark:bg-neutral-950"
        )}
      >
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5 dark:opacity-50 group-hover:opacity-10 dark:group-hover:opacity-80 transition-opacity duration-700",
          isTeamMode
            ? "from-blue-600/20 via-transparent to-purple-600/20"
            : "from-emerald-600/20 via-transparent to-teal-600/20"
        )} />
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <Zap size={100} strokeWidth={1} />
        </div>

        <div className="p-5 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className={cn(
              "h-5 w-5 rounded-lg flex items-center justify-center transition-colors",
              isTeamMode ? "bg-blue-500/10 dark:bg-blue-500/20" : "bg-emerald-500/10 dark:bg-emerald-500/20"
            )}>
              {isTeamMode ? (
                <Users size={12} className="text-blue-600 dark:text-blue-300" />
              ) : (
                <Activity size={12} className="text-emerald-600 dark:text-emerald-300" />
              )}
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em] transition-colors",
              isTeamMode ? "text-blue-600 dark:text-blue-300" : "text-emerald-600 dark:text-emerald-300"
            )}>
              {isTeamMode ? "Team Velocity" : "My Productivity"}
            </span>
          </div>

          {statsLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-7 w-32 bg-gray-100 dark:bg-white/10 rounded-lg" />
              <div className="h-4 w-full bg-gray-100 dark:bg-white/10 rounded-md" />
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-1">
                <div className="text-xl font-black tracking-tighter text-gray-900 dark:text-white">
                  {boost.toFixed(1)}% {boost >= 0 ? "Boost" : "Drop"}
                </div>
                {stats?.trend === 'up' && <ArrowRight size={14} className="text-emerald-500 dark:text-emerald-400 rotate-[-45deg] mb-1" />}
                {stats?.trend === 'down' && <ArrowRight size={14} className="text-rose-500 dark:text-rose-400 rotate-[45deg] mb-1" />}
              </div>

              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-5">
                {isTeamMode
                  ? "Hiệu suất làm việc của team đã thay đổi trong 7 ngày qua."
                  : "Hiệu suất làm việc cá nhân của bạn trong 7 ngày qua."}
              </p>

              <div className="space-y-5">
                {/* Streak or Top Performer Row */}
                {isTeamMode && stats?.topPerformer ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="h-8 w-8 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                      <img
                        src={stats.topPerformer.avatar || "https://ui-avatars.com/api/?name=" + stats.topPerformer.name}
                        alt={stats.topPerformer.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Top Performer</div>
                      <div className="text-[11px] font-bold truncate text-gray-900 dark:text-white">{stats.topPerformer.name}</div>
                    </div>
                    <div className="text-blue-600 dark:text-blue-400 font-black text-xs">
                      {stats.topPerformer.count} done
                    </div>
                  </div>
                ) : !isTeamMode && (stats?.streak ?? 0) > 0 ? (
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/10">
                    <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                      <Zap size={12} fill="currentColor" />
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {stats?.streak} day streak! Keep it up 🔥
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                    <span className="text-gray-400 dark:text-slate-400">Target Reached</span>
                    <span className={isTeamMode ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400"}>
                      {completed} / {target}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        isTeamMode
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                          : "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <Link
                  href="/productivity"
                  className="flex items-center justify-center w-full py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all gap-2 border border-gray-100 dark:border-white/5 group/btn text-gray-700 dark:text-white"
                >
                  <span className="group-hover/btn:translate-x-0.5 transition-transform">
                    {isTeamMode ? "Detailed Analytics" : "View My Report"}
                  </span>
                  <ArrowRight size={12} className="opacity-50 group-hover/btn:opacity-100" />
                </Link>
              </div>
            </>
          )}
        </div>
      </Card>

      <TipsGuideSideCard />
    </div>
  );
}
