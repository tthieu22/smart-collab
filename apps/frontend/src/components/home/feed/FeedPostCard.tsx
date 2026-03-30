'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { Button } from '@smart/components/ui/button';
import { useFeedStore } from '@smart/store/feed';
import type { FeedPost, FeedReactionType } from '@smart/types/feed';
import CommentList from './CommentList';
import CommentComposer from './CommentComposer';
import { Modal } from 'antd';
import {
  Bookmark,
  MessageCircle,
  Send,
  Heart,
} from 'lucide-react';

const reactionIcons: Record<FeedReactionType, React.ReactNode> = {
  like: <Heart size={20} />,
  love: <Heart size={20} />,
  haha: <Heart size={20} />,
  wow: <Heart size={20} />,
  sad: <Heart size={20} />,
  angry: <Heart size={20} />,
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
  const users = useFeedStore((s) => s.users);
  const toggleReaction = useFeedStore((s) => s.toggleReaction);
  const sharePost = useFeedStore((s) => s.sharePost);
  const toggleBookmark = useFeedStore((s) => s.toggleBookmark);

  const [openComments, setOpenComments] = useState(false);

  const author = useMemo(() => (post ? users[post.authorId] : null), [post, users]);

  if (!post) return null;

  const totalReactions = reactionTotal(post);

  return (
    <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/profile/${author?.id || post.authorId}`}
            className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800 shrink-0"
          >
            {author?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={author.avatarUrl} alt={author.name} className="h-full w-full object-cover" />
            ) : null}
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${author?.id || post.authorId}`}
                className="font-semibold truncate hover:underline"
              >
                {author?.name || 'User'}
              </Link>
              {author?.verified ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  Verified
                </span>
              ) : null}
            </div>
            <div className="text-xs text-gray-500 truncate">
              @{author?.username || 'user'} • {new Date(post.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div />
      </div>

      <div className="mt-3 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">
        {post.content}
      </div>

      {post.media?.length ? (
        <div className={`mt-3 grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.media.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-900">
              {m.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.alt || 'media'} className="h-64 w-full object-cover" />
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={m.url} controls className="w-full h-auto" />
              )}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>{totalReactions} reactions</span>
          <span>•</span>
          <span>{post.commentCount || 0} comments</span>
          <span>•</span>
          <span>{post.shareCount || 0} shares</span>
        </div>
        <div className="flex items-center gap-1">
          {post.myReaction ? (
            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-300">
              {reactionIcons[post.myReaction]}
              <span className="capitalize">{post.myReaction}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="ghost"
            size="small"
            active={Boolean(post.myReaction)}
            className="gap-2 text-gray-700 dark:text-gray-200"
            onClick={() => toggleReaction(post.id, 'like')}
          >
            {reactionIcons.like}
            <span>Like</span>
          </Button>

          <Button
            variant="ghost"
            size="small"
            className="gap-2 text-gray-700 dark:text-gray-200"
            onClick={() => setOpenComments(true)}
          >
            <MessageCircle size={16} />
            Comment
          </Button>

          <Button
            variant="ghost"
            size="small"
            className="gap-2 text-gray-700 dark:text-gray-200"
            onClick={() => sharePost(post.id)}
          >
            <Send size={16} />
            Share
          </Button>

          <Button
            variant="ghost"
            size="small"
            active={Boolean(post.bookmarkedByMe)}
            className="gap-2 text-gray-700 dark:text-gray-200"
            onClick={() => toggleBookmark(post.id)}
          >
            <Bookmark size={16} />
            Save
          </Button>
        </div>
      </div>

      <Modal
        title={`Bình luận - ${author?.name || 'User'}`}
        open={openComments}
        onCancel={() => setOpenComments(false)}
        footer={null}
        centered
        width={720}
        className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:overflow-hidden"
      >
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <CommentComposer postId={post.id} />
          <div className="mt-4">
            <CommentList postId={post.id} />
          </div>
        </div>
      </Modal>
    </Card>
  );
}

