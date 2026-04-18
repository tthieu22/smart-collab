'use client';

import { useEffect } from 'react';
import { useFeedStore } from '@smart/store/feed';
import { Card } from '@smart/components/ui/card';
import { Button } from '@smart/components/ui/button';
import { Heart, MessageCircle, Send, Bookmark, ChevronLeft } from 'lucide-react';
import CommentList from './CommentList';
import CommentComposer from './CommentComposer';
import Link from 'next/link';

interface PostDetailProps {
  postId: string;
  onBack?: () => void;
}

export default function PostDetail({ postId, onBack }: PostDetailProps) {
  const post = useFeedStore((s) => s.posts[postId]);
  const author = useFeedStore((s) => post ? s.users[post.authorId] : null);
  const fetchPostDetails = useFeedStore((s) => s.fetchPostDetails);
  const fetchComments = useFeedStore((s) => s.fetchComments);
  const toggleReaction = useFeedStore((s) => s.toggleReaction);
  const sharePost = useFeedStore((s) => s.sharePost);
  const toggleBookmark = useFeedStore((s) => s.toggleBookmark);

  useEffect(() => {
    if (postId) {
      fetchPostDetails(postId);
      fetchComments(postId);
    }
  }, [postId, fetchPostDetails, fetchComments]);

  if (!post) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {onBack && (
        <Button variant="ghost" className="mb-4" onClick={onBack}>
          <ChevronLeft size={20} /> Quay lại
        </Button>
      )}

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl bg-white border border-gray-100 dark:bg-neutral-950 dark:border-neutral-800 md:grid-cols-5 lg:grid-cols-6 shadow-xl">
        {/* Media Block */}
        <div className="col-span-1 border-b border-gray-100 dark:border-neutral-800 md:col-span-3 lg:col-span-4 md:border-b-0 md:border-r bg-black flex items-center justify-center min-h-[400px]">
          {post.media && post.media.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {post.media[0].type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.media[0].url}
                  alt={post.media[0].alt || 'Post media'}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video src={post.media[0].url} controls className="max-h-full max-w-full" />
              )}
            </div>
          ) : (
            <div className="text-gray-500 italic">Không có phương tiện</div>
          )}
        </div>

        {/* Content & Comments Block */}
        <div className="col-span-1 flex flex-col md:col-span-2 lg:col-span-2 h-[600px] md:h-auto">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-neutral-800 p-4">
            <Link
              href={`/profile/${author?.id || post.authorId}`}
              className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800"
            >
              {author?.avatarUrl && (
                <img src={author.avatarUrl} alt={author.name} className="h-full w-full object-cover" />
              )}
            </Link>
            <div className="min-w-0">
              <Link href={`/profile/${author?.id || post.authorId}`} className="block font-semibold hover:underline truncate">
                {author?.name || 'User'}
              </Link>
              <div className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Body/Comments Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="mb-6 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
              {post.content}
            </div>

            <div className="border-t border-gray-50 dark:border-neutral-900 pt-4">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Bình luận</h3>
              <CommentList postId={post.id} />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-100 dark:border-neutral-800 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleReaction(post.id, 'like')}
                  className={`transition-transform active:scale-125 ${post.myReaction ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  <Heart size={24} fill={post.myReaction ? 'currentColor' : 'none'} />
                </button>
                <button className="text-gray-600 dark:text-gray-400">
                  <MessageCircle size={24} />
                </button>
                <button onClick={() => sharePost(post.id)} className="text-gray-600 dark:text-gray-400">
                  <Send size={24} />
                </button>
              </div>
              <button
                onClick={() => toggleBookmark(post.id)}
                className={post.bookmarkedByMe ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}
              >
                <Bookmark size={24} fill={post.bookmarkedByMe ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="mb-4 text-xs font-semibold">
              {Object.values(post.reactionSummary || {}).reduce((a, b) => a + b, 0)} lượt thích
            </div>

            <CommentComposer postId={post.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
