'use client';

import Link from 'next/link';
import { Popover, Tooltip } from 'antd';
import { 
  Rocket, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Clock, 
  Star, 
  Globe, 
  Users, 
  Lock 
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

// Extend dayjs
dayjs.extend(relativeTime);
dayjs.locale('vi');

import { cn } from '@smart/lib/utils';
import UserAvatar from '@smart/components/ui/UserAvatar';
import type { FeedPost, FeedReactionType } from '@smart/types/feed';
import { useFeedStore } from '@smart/store/feed';

export const MOODS = [
  { emoji: '😊', label: 'Hạnh phúc', value: 'happy' },
  { emoji: '😇', label: 'Biết ơn', value: 'grateful' },
  { emoji: '🥰', label: 'Đang yêu', value: 'loved' },
  { emoji: '🤩', label: 'Hào hứng', value: 'excited' },
  { emoji: '🤔', label: 'Đang suy nghĩ', value: 'thinking' },
  { emoji: '😴', label: 'Mệt mỏi', value: 'tired' },
  { emoji: '😎', label: 'Ngầu', value: 'cool' },
  { emoji: '😤', label: 'Quyết tâm', value: 'determined' },
];

export const REACTION_CONFIG: Record<FeedReactionType, { label: string, color: string, emoji: string }> = {
  like: { label: 'Cất cánh', color: 'text-blue-600', emoji: '🚀' },
  love: { label: 'Yêu thích', color: 'text-red-500', emoji: '✨' },
  haha: { label: 'Haha', color: 'text-amber-500', emoji: '🔥' },
  wow: { label: 'Wow', color: 'text-emerald-500', emoji: '🪐' },
  sad: { label: 'Buồn', color: 'text-blue-400', emoji: '🌑' },
  angry: { label: 'Phẫn nộ', color: 'text-orange-600', emoji: '💥' },
};

export const visibilityIcons = {
  public: <Globe size={10} />,
  friends: <Users size={10} />,
  private: <Lock size={10} />,
};

// --- SUB-COMPONENTS ---

export function PostHeader({ post, author }: { post: FeedPost, author: any }) {
  const currentMood = MOODS.find(m => m.value === post.mood);
  
  return (
    <div className="flex items-center gap-3">
      <UserAvatar userId={post.authorId} size="md" showMood={true} mood={post.mood} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Link href={`/profile/${author?.id || post.authorId}`} className="font-bold text-[15px] text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
            {author?.name || 'Phi hành gia'}
          </Link>
          {author?.verified && <Star size={12} className="text-blue-500 fill-blue-500" />}
          {post.mood && (
            <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
              đang {currentMood?.emoji} {currentMood?.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
          <span className="hover:underline cursor-pointer">@{author?.username || 'phi-hanh-gia'}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {dayjs(post.createdAt).fromNow()}
          </span>
          <span>•</span>
          <Tooltip title={(post.visibility || 'public').toLowerCase() === 'public' ? 'Công khai' : (post.visibility || 'public').toLowerCase() === 'friends' ? 'Bạn bè' : 'Chỉ mình tôi'}>
            <span className="flex items-center gap-1">
              {visibilityIcons[(post.visibility || 'public').toLowerCase() as keyof typeof visibilityIcons] || visibilityIcons.public}
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export function ReactionSummary({ post }: { post: FeedPost }) {
  return (
    <div className="flex items-center gap-2">
      {(Object.entries(post.reactionSummary) as [FeedReactionType, number][]).map(([type, count]) => (
        count > 0 && (
          <div key={type} className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-[11px] font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-700 shadow-sm">
            <span>{REACTION_CONFIG[type].emoji}</span>
            <span>{count}</span>
          </div>
        )
      ))}
    </div>
  );
}

export function ReactionPicker({ postId }: { postId: string }) {
  const toggleReaction = useFeedStore(s => s.toggleReaction);
  
  return (
    <div className="flex items-center gap-1 p-1 bg-white dark:bg-neutral-900 rounded-full shadow-2xl border border-gray-100 dark:border-neutral-800 animate-in slide-in-from-bottom-2 duration-200">
      {(Object.entries(REACTION_CONFIG) as [FeedReactionType, any][]).map(([key, config]) => (
        <button
          key={key}
          onClick={() => toggleReaction(postId, key)}
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
}

export function PostActions({ post, layout = 'compact' }: { post: FeedPost, layout?: 'compact' | 'full' }) {
  const toggleReaction = useFeedStore(s => s.toggleReaction);
  const sharePost = useFeedStore(s => s.sharePost);
  const toggleBookmark = useFeedStore(s => s.toggleBookmark);
  const setActivePostId = useFeedStore(s => s.setActivePostId);
  const myReactionData = post.myReaction ? REACTION_CONFIG[post.myReaction] : null;

  const btnClass = cn(
    "flex items-center justify-center gap-2 rounded-xl transition-all font-bold active:scale-95 group",
    layout === 'compact' ? "h-9 px-3 text-xs" : "flex-1 h-11 text-sm"
  );

  return (
    <div className={cn("flex items-center gap-2", layout === 'full' && "w-full")}>
      <Popover
        content={<ReactionPicker postId={post.id} />}
        trigger="hover"
        mouseEnterDelay={0.3}
        color="transparent"
        styles={{ body: { boxShadow: 'none', padding: 0 } }}
      >
        <button
          onClick={() => toggleReaction(post.id, 'like')}
          className={cn(
            btnClass,
            post.myReaction
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              : "hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-500 dark:text-gray-400"
          )}
        >
          <Rocket size={layout === 'compact' ? 16 : 20} className={cn(post.myReaction ? "" : "-rotate-45 group-hover:rotate-0 transition-transform")} />
          <span>{myReactionData?.label || 'Cất cánh'}</span>
        </button>
      </Popover>

      <button
        onClick={() => setActivePostId(post.id)}
        className={cn(btnClass, "hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-500 dark:text-gray-400")}
      >
        <MessageCircle size={layout === 'compact' ? 16 : 20} />
        <span>Truyền tin</span>
        {layout === 'compact' && <span className="ml-1 opacity-60 font-medium">{post.commentCount || 0}</span>}
      </button>

      <button
        onClick={() => sharePost(post.id)}
        className={cn(
          "flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-500 dark:text-gray-400 transition-all active:scale-95",
          layout === 'compact' ? "w-9 h-9 ml-auto" : "w-11 h-11"
        )}
      >
        <Share2 size={layout === 'compact' ? 16 : 20} />
      </button>

      <button
        onClick={() => toggleBookmark(post.id)}
        className={cn(
          "flex items-center justify-center rounded-xl transition-all active:scale-95",
          layout === 'compact' ? "w-9 h-9" : "w-11 h-11",
          post.bookmarkedByMe
            ? "bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400"
            : "hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-500 dark:text-gray-400"
        )}
      >
        <Bookmark size={layout === 'compact' ? 16 : 20} fill={post.bookmarkedByMe ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
