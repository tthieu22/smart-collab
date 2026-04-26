'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFeedStore } from '@smart/store/feed';
import UserAvatar from '@smart/components/ui/UserAvatar';
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
  const [mediaIndex, setMediaIndex] = useState(0);

  const media = useMemo(() => post?.media || [], [post?.media]);
  const currentMedia = media[mediaIndex];

  useEffect(() => {
    if (postId) {
      fetchPostDetails(postId);
      fetchComments(postId);
    }
  }, [postId, fetchPostDetails, fetchComments]);

  useEffect(() => {
    setMediaIndex(0);
  }, [postId]);


  useEffect(() => {
    if (!media.length) {
      setMediaIndex(0);
      return;
    }
    if (mediaIndex > media.length - 1) {
      setMediaIndex(media.length - 1);
    }
  }, [media, mediaIndex]);

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
          {media.length > 0 && currentMedia ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {currentMedia.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentMedia.url}
                  alt={currentMedia.alt || 'Post media'}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video src={currentMedia.url} controls className="max-h-full max-w-full" />
              )}
              {media.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-3 rounded-full bg-black/50 text-white px-3 py-1"
                    onClick={() => setMediaIndex((prev) => (prev - 1 + media.length) % media.length)}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="absolute right-3 rounded-full bg-black/50 text-white px-3 py-1"
                    onClick={() => setMediaIndex((prev) => (prev + 1) % media.length)}
                  >
                    ›
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 text-white text-xs px-2 py-1">
                    {mediaIndex + 1}/{media.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-gray-500 italic">Không có phương tiện</div>
          )}
        </div>

        {/* Content & Comments Block */}
        <div className="col-span-1 flex flex-col md:col-span-2 lg:col-span-2 min-h-[500px] md:h-auto">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-neutral-800 p-4">
            <UserAvatar userId={post.authorId} size="md" />
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
