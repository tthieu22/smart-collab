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
}

export default function PostDetail({ postId }: PostDetailProps) {
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
    <div className="mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="grid grid-cols-1 overflow-hidden rounded-none md:rounded-[32px] bg-white border-0 md:border border-gray-100 dark:bg-neutral-950 dark:border-neutral-800 md:grid-cols-5 lg:grid-cols-7 shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
        {/* Media Block */}
        <div className="col-span-1 border-b border-gray-100 dark:border-neutral-800 md:col-span-3 lg:col-span-4 md:border-b-0 md:border-r bg-black flex items-center justify-center min-h-[500px] lg:min-h-[700px] relative">
          {media.length > 0 && currentMedia ? (
            <div className="relative w-full h-full flex items-center justify-center group/media">
              {currentMedia.type === 'image' ? (
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
                    className="absolute left-6 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/60 transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover/media:opacity-100 translate-x-[-10px] group-hover/media:translate-x-0"
                    onClick={() => setMediaIndex((prev) => (prev - 1 + media.length) % media.length)}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="absolute right-6 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover/media:opacity-100 translate-x-[10px] group-hover/media:translate-x-0"
                    onClick={() => setMediaIndex((prev) => (prev + 1) % media.length)}
                  >
                    ›
                  </button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-black px-4 py-1.5 uppercase tracking-[0.2em] border border-white/10">
                    {mediaIndex + 1} / {media.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-12 font-mono text-sm text-gray-500 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/30 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/30 animate-pulse delay-150" />
                <div className="w-3 h-3 rounded-full bg-green-500/30 animate-pulse delay-300" />
              </div>
              <span className="opacity-40 uppercase tracking-widest font-bold">Interstellar link: Offline</span>
            </div>
          )}
        </div>

        {/* Content & Comments Block */}
        <div className="col-span-1 flex flex-col md:col-span-2 lg:col-span-3 h-[600px] md:h-auto bg-white dark:bg-neutral-950">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-50 dark:border-neutral-900 p-5">
            <PostHeader post={post} author={author} />
            
            <div className="flex items-center gap-1">
              <Dropdown menu={{ items: dropdownItems }} trigger={['click']} placement="bottomRight">
                <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-400 transition-all">
                  <MoreHorizontal size={20} />
                </button>
              </Dropdown>
              <button 
                onClick={() => useFeedStore.getState().setActivePostId(null)}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body/Comments Scroll Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6">
              {post.title && !post.backgroundStyle && (
                <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-3">
                  {post.title}
                </h2>
              )}

              <div className={cn(
                "mb-8 whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200",
                post.backgroundStyle ? cn("rounded-[28px] p-10 flex flex-col items-center justify-center min-h-[240px] text-center font-black text-2xl shadow-inner text-white", post.backgroundStyle) : "text-[15px]"
              )}>
                {post.content}
              </div>

              {post.linkUrl && !post.backgroundStyle && (
                <div className="mb-8">
                  <a
                    href={post.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100/50 dark:border-blue-900/30 shadow-sm"
                  >
                    <ExternalLink size={14} />
                    Khám phá nguồn tín hiệu
                  </a>
                </div>
              )}

              <div className="border-t border-gray-50 dark:border-neutral-900 pt-6">
                <div className="text-[11px] font-bold text-gray-400 mb-4 px-1">Tín hiệu phản hồi</div>
                <CommentList postId={post.id} />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-100 dark:border-neutral-900 p-5 bg-gray-50/20 dark:bg-black/20">
            {/* Reaction Stats */}
            <div className="flex items-center justify-between mb-5 px-1">
              <ReactionSummary post={post} />
              <div className="text-[11px] text-gray-500 font-bold opacity-60 uppercase tracking-wider">
                {post.commentCount || 0} TRUYỀN TIN • {post.shareCount || 0} CHIA SẺ
              </div>
            </div>

            <div className="border-t border-gray-50 dark:border-neutral-900 pt-4">
              <PostActions post={post} layout="full" />
            </div>

            <div className="mt-5">
              <CommentComposer postId={post.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
