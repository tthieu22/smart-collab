'use client';

import { useMemo } from 'react';
import { useFeedStore } from '@smart/store/feed';
import { Rocket, Clock } from 'lucide-react';
import UserAvatar from '@smart/components/ui/UserAvatar';
import dayjs from 'dayjs';
import { cn } from '@smart/lib/utils';

const EMPTY_ARRAY: string[] = [];

interface CommentListProps {
  postId: string;
  limit?: number;
}

export default function CommentList({ postId, limit }: CommentListProps) {
  const commentIds = useFeedStore((s) => s.commentsByPostId[postId] || EMPTY_ARRAY);
  const comments = useFeedStore((s) => s.comments);
  const users = useFeedStore((s) => s.users);
  const toggleCommentLike = useFeedStore((s) => s.toggleCommentLike);
  const setActivePostId = useFeedStore((s) => s.setActivePostId);

  const items = useMemo(() => {
    let list = commentIds
      .map((id) => comments[id])
      .filter(Boolean)
      .map((c) => ({
        ...c,
        author: users[c.authorId],
      }));
    
    if (limit) {
      list = list.slice(-limit); // Show last N comments
    }
    
    return list;
  }, [commentIds, comments, users, limit]);

  if (!items.length) return null;

  return (
    <div className="space-y-4">
      {commentIds.length > (limit || 999) && (
        <button 
          onClick={() => setActivePostId(postId)}
          className="text-[11px] font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 mb-2 px-1 transition-colors"
        >
          Xem thêm {commentIds.length - (limit || 0)} bản tin phản hồi khác...
        </button>
      )}

      {items.map((c) => (
        <div key={c.id} className="flex gap-2.5 group/comment">
          <UserAvatar userId={c.authorId} size="sm" />

          <div className="flex-1 min-w-0">
            <div className="rounded-2xl bg-gray-100/80 dark:bg-neutral-900/80 px-3 py-2 border border-gray-100/50 dark:border-neutral-800/50 group-hover/comment:border-blue-500/20 transition-all">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="text-[12px] font-bold text-gray-900 dark:text-white truncate">
                  {c.author?.name || 'Phi hành gia'}
                </div>
                <div className="text-[10px] text-gray-500 flex items-center gap-1 shrink-0">
                  <Clock size={8} />
                  {dayjs(c.createdAt).fromNow()}
                </div>
              </div>
              <div className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                {c.content}
              </div>
            </div>
            <div className="mt-1 flex items-center gap-3 ml-2 text-[10px] font-bold text-gray-500">
              <button 
                onClick={() => toggleCommentLike(c.id)}
                className={cn(
                  "flex items-center gap-1 transition-colors",
                  c.likedByMe ? "text-blue-500" : "hover:text-blue-500"
                )}
              >
                <Rocket size={10} className={cn(!c.likedByMe && "-rotate-45")} fill={c.likedByMe ? "currentColor" : "none"} />
                {c.likeCount ? <span>{c.likeCount}</span> : "Cất cánh"}
              </button>
              <button 
                onClick={() => setActivePostId(postId)}
                className="hover:text-blue-500"
              >
                Đáp lại
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
