'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { Button } from '@smart/components/ui/button';
import { useFeedStore } from '@smart/store/feed';
import UserAvatar from '@smart/components/ui/UserAvatar';
import type { FeedPost, FeedReactionType, FeedMedia } from '@smart/types/feed';
import { 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Heart, 
  MoreHorizontal,
  ExternalLink,
  Clock,
  Globe,
  Users,
  Lock
} from 'lucide-react';
import { Dropdown, MenuProps, Tooltip, Popover } from 'antd';
import { cn } from '@smart/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const MOODS = [
  { emoji: '😊', label: 'Hạnh phúc', value: 'happy' },
  { emoji: '😇', label: 'Biết ơn', value: 'grateful' },
  { emoji: '🥰', label: 'Đang yêu', value: 'loved' },
  { emoji: '🤩', label: 'Hào hứng', value: 'excited' },
  { emoji: '🤔', label: 'Đang suy nghĩ', value: 'thinking' },
  { emoji: '😴', label: 'Mệt mỏi', value: 'tired' },
  { emoji: '😎', label: 'Ngầu', value: 'cool' },
  { emoji: '😤', label: 'Quyết tâm', value: 'determined' },
];

const REACTION_CONFIG: Record<FeedReactionType, { label: string, color: string, emoji: string }> = {
  like: { label: 'Thích', color: 'text-blue-600', emoji: '👍' },
  love: { label: 'Yêu thích', color: 'text-red-500', emoji: '❤️' },
  haha: { label: 'Haha', color: 'text-amber-500', emoji: '😆' },
  wow: { label: 'Wow', color: 'text-emerald-500', emoji: '😮' },
  sad: { label: 'Buồn', color: 'text-blue-400', emoji: '😢' },
  angry: { label: 'Phẫn nộ', color: 'text-orange-600', emoji: '😡' },
};

const visibilityIcons = {
  public: <Globe size={10} />,
  friends: <Users size={10} />,
  private: <Lock size={10} />,
};

function reactionTotal(p: FeedPost) {
  const r = p.reactionSummary;
  return (
    (r?.like || 0) +
    (r?.love || 0) +
    (r?.haha || 0) +
    (r?.wow || 0) +
    (r?.sad || 0) +
    (r?.angry || 0)
  );
}

export default function FeedPostCard({ postId }: { postId: string }) {
  const post = useFeedStore((s) => s.posts[postId]);
  const author = useFeedStore((s) => post ? s.users[post.authorId] : null);
  const toggleReaction = useFeedStore((s) => s.toggleReaction);
  const sharePost = useFeedStore((s) => s.sharePost);
  const toggleBookmark = useFeedStore((s) => s.toggleBookmark);
  const setActivePostId = useFeedStore((s) => s.setActivePostId);

  if (!post) return null;

  const totalReactions = reactionTotal(post);
  const media: FeedMedia[] = post.media ?? [];
  const currentMood = MOODS.find(m => m.value === post.mood);
  const myReactionData = post.myReaction ? REACTION_CONFIG[post.myReaction] : null;

  const dropdownItems: MenuProps['items'] = [
    { key: 'copy', label: 'Sao chép liên kết' },
    { key: 'report', label: 'Báo cáo bài viết', danger: true },
  ];

  const reactionPicker = (
    <div className="flex items-center gap-1 p-1 bg-white dark:bg-neutral-900 rounded-full shadow-2xl border border-gray-100 dark:border-neutral-800 animate-in slide-in-from-bottom-2 duration-200">
      {(Object.entries(REACTION_CONFIG) as [FeedReactionType, any][]).map(([key, config]) => (
        <button
          key={key}
          onClick={() => toggleReaction(post.id, key)}
          className="group relative flex flex-col items-center transition-transform hover:scale-150 duration-200 px-1"
        >
          <span className="text-2xl mb-1">{config.emoji}</span>
          <span className="absolute -top-8 px-2 py-0.5 rounded-lg bg-gray-900 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {config.label}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <Card 
      padding="none" 
      className="group overflow-hidden dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5 shadow-sm hover:shadow-md transition-all duration-300 rounded-[24px]"
    >
      <div className="p-4 sm:p-5">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar 
              userId={post.authorId} 
              size="md" 
              showMood={true} 
              mood={post.mood}
            />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/profile/${author?.id || post.authorId}`}
                  className="font-bold text-[15px] text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                >
                  {author?.name || 'Người dùng'}
                </Link>
                {author?.verified && (
                  <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-2 h-2 text-white fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  </span>
                )}
                {post.mood && (
                  <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                    đang cảm thấy {currentMood?.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                <span className="hover:underline cursor-pointer">@{author?.username || 'user'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {dayjs(post.createdAt).fromNow()}
                </span>
                <span>•</span>
                <Tooltip title={post.visibility === 'public' ? 'Công khai' : post.visibility === 'friends' ? 'Bạn bè' : 'Chỉ mình tôi'}>
                  <span className="flex items-center gap-1">
                    {visibilityIcons[post.visibility || 'public']}
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>

          <Dropdown menu={{ items: dropdownItems }} trigger={['click']} placement="bottomRight">
            <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-400 transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </Dropdown>
        </div>

        {/* CONTENT */}
        <div 
          onClick={() => setActivePostId(post.id)}
          className={cn(
            "cursor-pointer space-y-3",
            post.backgroundStyle ? cn("rounded-2xl p-10 flex flex-col items-center justify-center min-h-[240px]", post.backgroundStyle) : ""
          )}
        >
          {post.title && !post.backgroundStyle && (
            <h2 className="text-lg font-black text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {post.title}
            </h2>
          )}

          <div className={cn(
            "break-words leading-relaxed opacity-90",
            post.backgroundStyle
              ? "text-2xl font-black text-center whitespace-pre-wrap"
              : "text-[15px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap"
          )}>
            {post.content}
          </div>

          {post.linkUrl && !post.backgroundStyle && (
            <div className="pt-1">
              <a 
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100/50 dark:border-blue-900/30"
              >
                <ExternalLink size={14} />
                Xem nguồn tin
              </a>
            </div>
          )}
        </div>
      </div>

      {/* MEDIA */}
      {media.length > 0 && !post.backgroundStyle && (
        <div 
          onClick={() => setActivePostId(post.id)}
          className={cn(
            "relative w-full cursor-pointer px-4 sm:px-5 pb-2",
            media.length === 1 ? "" : "grid gap-2 grid-cols-2"
          )}
        >
          {media.map((m, idx) => (
            <div
              key={m.id}
              className={cn(
                "overflow-hidden rounded-2xl bg-gray-100 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-sm",
                media.length === 1 ? "w-full" : "aspect-square"
              )}
            >
              {m.type === 'image' ? (
                <img
                  src={m.url}
                  alt={m.alt || 'media'}
                  className={cn(
                    "w-full object-cover transition-transform duration-700 hover:scale-105",
                    media.length === 1 ? "max-h-[600px] h-auto" : "h-full"
                  )}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Error';
                  }}
                />
              ) : (
                <video src={m.url} controls className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="px-4 sm:p-5 pt-2 pb-4">
        {/* STATS */}
        <div className="flex items-center justify-between mb-4 px-1 text-[12px] text-gray-500 font-medium border-t border-gray-50 dark:border-neutral-900 pt-3">
          <div className="flex items-center gap-3">
            <Popover 
              content={
                <div className="flex flex-col gap-2 p-1">
                  {(Object.entries(post.reactionSummary) as [FeedReactionType, number][]).map(([type, count]) => (
                    count > 0 && (
                      <div key={type} className="flex items-center gap-2 text-xs">
                        <span>{REACTION_CONFIG[type].emoji}</span>
                        <span className="font-bold">{count}</span>
                        <span className="text-gray-400">{REACTION_CONFIG[type].label}</span>
                      </div>
                    )
                  ))}
                </div>
              }
              title="Chi tiết cảm xúc"
              trigger="hover"
            >
              <span className="flex items-center gap-1 hover:text-blue-500 cursor-pointer transition-colors">
                <span className="font-bold text-gray-900 dark:text-gray-100">{totalReactions}</span> cảm xúc
              </span>
            </Popover>
            <span className="flex items-center gap-1 hover:text-blue-500 cursor-pointer transition-colors">
              <span className="font-bold text-gray-900 dark:text-gray-100">{post.commentCount || 0}</span> bình luận
            </span>
          </div>
          <span className="hover:text-blue-500 cursor-pointer transition-colors">
            <span className="font-bold text-gray-900 dark:text-gray-100">{post.shareCount || 0}</span> chia sẻ
          </span>
        </div>

        {/* BUTTONS */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Popover 
            content={reactionPicker} 
            trigger="hover" 
            mouseEnterDelay={0.5}
            overlayClassName="reaction-popover"
            color="transparent"
            styles={{ body: { boxShadow: 'none', padding: 0 } }}
          >
            <button
              onClick={() => toggleReaction(post.id, 'like')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl transition-all font-bold text-xs sm:text-sm active:scale-95",
                post.myReaction
                  ? "bg-blue-50 dark:bg-blue-900/30"
                  : "hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-600 dark:text-gray-400"
              )}
            >
              {post.myReaction ? (
                <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                  <span className="text-lg">{myReactionData?.emoji}</span>
                  <span className={cn(myReactionData?.color)}>{myReactionData?.label}</span>
                </div>
              ) : (
                <>
                  <Heart size={18} />
                  Thích
                </>
              )}
            </button>
          </Popover>

          <button
            onClick={() => setActivePostId(post.id)}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-600 dark:text-gray-400 transition-all font-bold text-xs sm:text-sm active:scale-95"
          >
            <MessageSquare size={18} />
            Bình luận
          </button>

          <button
            onClick={() => sharePost(post.id)}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-600 dark:text-gray-400 transition-all font-bold text-xs sm:text-sm active:scale-95"
          >
            <Share2 size={18} />
            Chia sẻ
          </button>

          <button
            onClick={() => toggleBookmark(post.id)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-95",
              post.bookmarkedByMe
                ? "bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400"
                : "hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-600 dark:text-gray-400"
            )}
            title="Lưu bài viết"
          >
            <Bookmark size={18} fill={post.bookmarkedByMe ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </Card>
  );
}