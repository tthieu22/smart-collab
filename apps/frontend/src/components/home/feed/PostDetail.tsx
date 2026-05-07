'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFeedStore } from '@smart/store/feed';
import { Button } from '@smart/components/ui/button';
import {
  MoreHorizontal,
  ExternalLink,
  X
} from 'lucide-react';
import CommentList from './CommentList';
import CommentComposer from './CommentComposer';
import { Dropdown, MenuProps, Avatar } from 'antd';
import { cn } from '@smart/lib/utils';
import { PostHeader, ReactionSummary, PostActions } from './PostShared';

interface PostDetailProps {
  postId: string;
  onBack?: () => void;
}

export default function PostDetail({ postId, onBack }: PostDetailProps) {
  const post = useFeedStore((s) => s.posts[postId]);
  const author = useFeedStore((s) => post ? s.users[post.authorId] : null);
  const fetchPostDetails = useFeedStore((s) => s.fetchPostDetails);
  const fetchComments = useFeedStore((s) => s.fetchComments);
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

  if (!post) {
    return (
      <div className="flex h-96 items-center justify-center bg-white dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Đang đồng bộ tín hiệu...</span>
        </div>
      </div>
    );
  }

  const dropdownItems: MenuProps['items'] = [
    { key: 'copy', label: 'Sao chép liên kết' },
    { key: 'report', label: 'Báo cáo bài viết', danger: true },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500 min-h-screen flex flex-col">
      <div className="flex-1 rounded-none md:rounded-[32px] bg-white dark:bg-neutral-950 border-0 md:border border-gray-100 dark:border-neutral-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/5 relative flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-50 dark:border-neutral-900 p-3 md:p-6 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-30 rounded-t-none md:rounded-t-[32px]">
          <PostHeader post={post} author={author} />

          <div className="flex items-center gap-2">
            <Dropdown menu={{ items: dropdownItems }} trigger={['click']} placement="bottomRight">
              <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-400 transition-all">
                <MoreHorizontal size={20} />
              </button>
            </Dropdown>
            <button
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  useFeedStore.getState().setActivePostId(null);
                }
              }}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content & Media Scroll Area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 md:p-8">
            {/* Title & Text */}
            {post.title && !post.backgroundStyle && (
              <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-tight mb-4 px-1">
                {post.title}
              </h2>
            )}

            <div className={cn(
              "mb-6 whitespace-pre-wrap leading-relaxed",
              post.backgroundStyle 
                ? cn("-mx-4 md:-mx-8 p-10 md:p-16 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] text-center font-black text-2xl md:text-4xl shadow-inner text-white", post.backgroundStyle) 
                : "text-[16px] md:text-[17px] text-gray-800 dark:text-gray-200 px-1"
            )}>
              {post.content}
            </div>

            {/* Media Block - Integrated inside content */}
            {media.length > 0 && !post.backgroundStyle && (
              <div className="mb-8 -mx-1">
                <div className={cn(
                  "relative w-full overflow-hidden rounded-[24px] bg-gray-100 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-lg",
                  media.length > 1 ? "aspect-video" : ""
                )}>
                  {currentMedia.type === 'image' ? (
                    <img
                      src={currentMedia.url}
                      alt={currentMedia.alt || 'Post media'}
                      className="w-full h-full object-contain bg-black/5"
                    />
                  ) : (
                    <video src={currentMedia.url} controls className="w-full h-full object-contain bg-black" />
                  )}

                  {media.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/60 transition-all backdrop-blur-md border border-white/10"
                        onClick={() => setMediaIndex((prev) => (prev - 1 + media.length) % media.length)}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/60 transition-all backdrop-blur-md border border-white/10"
                        onClick={() => setMediaIndex((prev) => (prev + 1) % media.length)}
                      >
                        ›
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest border border-white/10">
                        {mediaIndex + 1} / {media.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {post.linkUrl && !post.backgroundStyle && (
              <div className="mb-8 px-1">
                <a
                  href={post.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[13px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100/50 dark:border-blue-900/30 shadow-sm"
                >
                  <ExternalLink size={16} />
                  Khám phá nguồn tín hiệu gốc
                </a>
              </div>
            )}

            {/* Reaction Stats & Actions */}
            <div className="border-t border-gray-50 dark:border-neutral-900 pt-6">
              <div className="flex items-center justify-between mb-6 px-1">
                <ReactionSummary post={post} />
                <div className="text-[11px] text-gray-400 font-black uppercase tracking-widest opacity-80">
                  {post.commentCount || 0} TRUYỀN TIN • {post.shareCount || 0} CHIA SẺ
                </div>
              </div>
              <PostActions post={post} layout="full" />
            </div>

            {/* Comments Area */}
            <div className="border-t border-gray-50 dark:border-neutral-900 mt-8 pt-8">
              <div className="text-[11px] font-black text-gray-400 mb-6 px-1 uppercase tracking-widest">Tín hiệu phản hồi</div>
              <div className="mt-4">
                <CommentList postId={post.id} />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Comment Composer */}
        <div className="sticky bottom-0 z-30 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-2xl border-t border-gray-100 dark:border-neutral-900 p-3 md:p-4 rounded-b-none md:rounded-b-[32px]">
          <CommentComposer postId={post.id} />
        </div>
      </div>
    </div>
  );
}
