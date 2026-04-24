'use client';

import { useMemo } from 'react';
import { useFeedStore } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@smart/components/ui/button';
import { Heart } from 'lucide-react';
import UserAvatar from '@smart/components/ui/UserAvatar';

const EMPTY_ARRAY: string[] = [];

export default function CommentList({ postId }: { postId: string }) {
  // Separate selectors to avoid creating a new object on each render (prevents getSnapshot warning)
  const commentIds = useFeedStore((s) => s.commentsByPostId[postId] || EMPTY_ARRAY);
  const comments = useFeedStore((s) => s.comments);
  const users = useFeedStore((s) => s.users);
  const toggleCommentLike = useFeedStore((s) => s.toggleCommentLike);

  const items = useMemo(
    () =>
      commentIds
        .map((id) => comments[id])
        .filter(Boolean)
        .map((c) => ({
          ...c,
          author: users[c.authorId],
        })),
    [commentIds, comments, users],
  );

  if (!items.length) return null;

  return (
    <div className="mt-3 space-y-3">
      {items.map((c) => (
        <div key={c.id} className="flex gap-3">
          <UserAvatar userId={c.authorId} size="sm" />

          <div className="flex-1 min-w-0">
            <div className="rounded-2xl bg-gray-50 dark:bg-neutral-900 px-3 py-2 border border-gray-100 dark:border-neutral-800">
              <div className="text-sm font-medium truncate">{c.author?.name || 'User'}</div>
              <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                {c.content}
              </div>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span>{new Date(c.createdAt).toLocaleString()}</span>
              <Button
                variant="ghost"
                size="small"
                active={Boolean(c.likedByMe)}
                className="h-7 px-2"
                onClick={() => toggleCommentLike(c.id)}
              >
                <Heart size={14} />
                {c.likeCount ? <span className="ml-1">{c.likeCount}</span> : null}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
