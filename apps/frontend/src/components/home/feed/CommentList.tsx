'use client';

import { useMemo } from 'react';
import { useFeedStore } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@smart/components/ui/button';
import { Heart } from 'lucide-react';

export default function CommentList({ postId }: { postId: string }) {
  const { commentIds, comments, users, toggleCommentLike } = useFeedStore(
    useShallow((s) => ({
      commentIds: s.commentsByPostId[postId] || [],
      comments: s.comments,
      users: s.users,
      toggleCommentLike: s.toggleCommentLike,
    }))
  );

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
          <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800 shrink-0">
            {c.author?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.author.avatarUrl}
                alt={c.author.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

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
