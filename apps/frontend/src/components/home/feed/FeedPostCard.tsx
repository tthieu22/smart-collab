'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { Button } from '@smart/components/ui/button';
import { useFeedStore } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';
import type { FeedPost, FeedReactionType, FeedMedia } from '@smart/types/feed';
import CommentList from './CommentList';
import CommentComposer from './CommentComposer';
import { Modal } from 'antd';
import { Bookmark, MessageCircle, Send, Heart } from 'lucide-react';

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
  // Separate selectors to avoid creating a new object on each render
  const post = useFeedStore((s) => s.posts[postId]);
  const author = useFeedStore((s) => post ? s.users[post.authorId] : null);
  const toggleReaction = useFeedStore((s) => s.toggleReaction);
  const sharePost = useFeedStore((s) => s.sharePost);
  const toggleBookmark = useFeedStore((s) => s.toggleBookmark);
  const fetchComments = useFeedStore((s) => s.fetchComments);
  const setActivePostId = useFeedStore((s) => s.setActivePostId);

  const [openComments, setOpenComments] = useState(false);

  useEffect(() => {
    if (openComments) {
      fetchComments(postId);
    }
  }, [openComments, postId, fetchComments]);

  if (!post) return null;

  const totalReactions = reactionTotal(post);
  const media: FeedMedia[] = post.media ?? [];

  return (
    <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/profile/${author?.id || post.authorId}`}
            className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800 shrink-0"
          >
            {author?.avatarUrl && (
              <img
                src={author.avatarUrl}
                alt={author.name}
                className="h-full w-full object-cover"
              />
            )}
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${author?.id || post.authorId}`}
                className="font-semibold truncate hover:underline"
              >
                {author?.name || 'User'}
              </Link>
              {author?.verified && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  Verified
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 truncate">
              @{author?.username || 'user'} •{' '}
              {new Date(post.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div 
        onClick={() => setActivePostId(post.id)}
        className="block group cursor-pointer"
      >
        {post.title && (
          <div className="mt-3 text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
            {post.title}
          </div>
        )}

        <div className="mt-2 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words opacity-90 leading-relaxed">
          {post.content}
        </div>

        {post.linkUrl && (
          <div className="mt-3">
            <Button 
              variant="outline" 
              size="small" 
              className="text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950"
              onClick={(e) => {
                e.stopPropagation();
                window.open(post.linkUrl, '_blank');
              }}
            >
              Xem chi tiết
            </Button>
          </div>
        )}

        {media.length > 0 && (
          <div className={`mt-3 grid gap-2 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {media.map((m) => (
              <div
                key={m.id}
                className="overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-900 border border-transparent group-hover:border-blue-500/30 transition-all"
              >
                {m.type === 'image' ? (
                  <img
                    src={m.url}
                    alt={m.alt || 'media'}
                    className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <video src={m.url} controls className="w-full h-auto" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>{totalReactions} reactions</span>
          <span>•</span>
          <span>{post.commentCount || 0} comments</span>
          <span>•</span>
          <span>{post.shareCount || 0} shares</span>
        </div>

        {post.myReaction && (
          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-300">
            {reactionIcons[post.myReaction]}
            <span className="capitalize">{post.myReaction}</span>
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <Button
          variant="ghost"
          size="small"
          active={Boolean(post.myReaction)}
          onClick={() => toggleReaction(post.id, 'like')}
        >
          {reactionIcons.like} Like
        </Button>

        <Button
          variant="ghost"
          size="small"
          onClick={() => setActivePostId(post.id)}
        >
          <MessageCircle size={16} /> Comment
        </Button>

        <Button
          variant="ghost"
          size="small"
          onClick={() => sharePost(post.id)}
        >
          <Send size={16} /> Share
        </Button>

        <Button
          variant="ghost"
          size="small"
          active={Boolean(post.bookmarkedByMe)}
          onClick={() => toggleBookmark(post.id)}
        >
          <Bookmark size={16} /> Save
        </Button>
      </div>

      <Modal
        title={`Bình luận - ${author?.name || 'User'}`}
        open={openComments}
        // Ensure children are unmounted when the modal closes to avoid stray state updates.
        destroyOnHidden
        onCancel={() => setOpenComments(false)}
        footer={null}
        centered
        width={720}
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