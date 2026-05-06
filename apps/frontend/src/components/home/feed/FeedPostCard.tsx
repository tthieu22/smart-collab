'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@smart/components/ui/card';
import { useFeedStore } from '@smart/store/feed';
import UserAvatar from '@smart/components/ui/UserAvatar';
import type { FeedPost, FeedMedia } from '@smart/types/feed';
import {
  MoreHorizontal,
  ExternalLink,
  Send
} from 'lucide-react';
import { Dropdown, MenuProps, Input, Avatar, message } from 'antd';
import { useUserStore } from '@smart/store/user';
import { cn } from '@smart/lib/utils';
import { PostHeader, ReactionSummary, PostActions } from './PostShared';
import CommentList from './CommentList';

export default function FeedPostCard({ postId }: { postId: string }) {
  const post = useFeedStore((s) => s.posts[postId]);
  const author = useFeedStore((s) => post ? s.users[post.authorId] : null);
  const setActivePostId = useFeedStore((s) => s.setActivePostId);
  const fetchComments = useFeedStore((s) => s.fetchComments);
  const addComment = useFeedStore((s) => s.addComment);
  const currentUser = useUserStore((s) => s.currentUser);
  
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchComments(postId);
    }
  }, [postId, fetchComments]);

  if (!post) return null;

  const media: FeedMedia[] = post.media ?? [];

  const handleSendComment = async () => {
    if (!commentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addComment(post.id, commentText.trim());
      setCommentText('');
    } catch (err) {
      message.error('Không thể gửi bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dropdownItems: MenuProps['items'] = [
    { key: 'copy', label: 'Sao chép liên kết' },
    { key: 'report', label: 'Báo cáo bài viết', danger: true },
  ];

  return (
    <Card
      padding="none"
      className="group/card overflow-hidden dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5 shadow-sm hover:shadow-md transition-all duration-300 rounded-[24px]"
    >
      <div className="p-3 sm:p-4">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-3">
          <PostHeader post={post} author={author} />

          <Dropdown menu={{ items: dropdownItems }} trigger={['click']} placement="bottomRight">
            <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-400 transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </Dropdown>
        </div>

        {/* CONTENT */}
        <div
          onClick={() => setActivePostId(post.id)}
          className={cn(
            "cursor-pointer space-y-3",
            post.backgroundStyle ? cn("rounded-[28px] p-10 flex flex-col items-center justify-center min-h-[240px] text-center font-black text-2xl shadow-inner text-white", post.backgroundStyle) : ""
          )}
        >
          {post.title && !post.backgroundStyle && (
            <h2 className="text-lg font-black text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {post.title}
            </h2>
          )}

          <div className={cn(
            "break-words leading-relaxed opacity-90",
            post.backgroundStyle
              ? "text-2xl font-black text-center whitespace-pre-wrap"
              : "text-[15px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap"
          )}>
            {post.content}
          </div>

          {post.linkUrl && !post.backgroundStyle && (
            <div className="pt-1">
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100/50 dark:border-blue-900/30"
              >
                <ExternalLink size={14} />
                Xem nguồn tin
              </a>
            </div>
          )}
        </div>

        {/* MEDIA */}
        {media.length > 0 && !post.backgroundStyle && (
          <div
            onClick={() => setActivePostId(post.id)}
            className={cn(
              "relative w-full cursor-pointer mt-3",
              media.length === 1 ? "" : "grid gap-2 grid-cols-2"
            )}
          >
            {media.map((m, idx) => (
              <div
                key={m.id}
                className={cn(
                  "overflow-hidden rounded-2xl bg-gray-100 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-sm",
                  media.length === 1 ? "w-full" : "aspect-square"
                )}
              >
                {idx < 4 && (
                   m.type === 'image' ? (
                    <img
                      src={m.url}
                      alt={m.alt || 'media'}
                      className={cn(
                        "w-full object-cover transition-transform duration-700 hover:scale-105",
                        media.length === 1 ? "max-h-[600px] h-auto" : "h-full"
                      )}
                    />
                  ) : (
                    <video src={m.url} controls className="w-full h-full object-cover" />
                  )
                )}
                {idx === 3 && media.length > 4 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xl rounded-2xl">
                    +{media.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* REACTIONS SUMMARY */}
        <div className="flex items-center justify-between mt-5 mb-3 px-1">
          <ReactionSummary post={post} />
          <div className="text-[11px] text-gray-500 font-medium">
            <span className="hover:text-blue-500 cursor-pointer">{post.commentCount || 0} truyền tin</span>
            <span className="mx-1.5">•</span>
            <span className="hover:text-blue-500 cursor-pointer">{post.shareCount || 0} chia sẻ</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="border-t border-gray-50 dark:border-neutral-900 pt-3 pb-0.5">
          <PostActions post={post} layout="compact" />
        </div>
      </div>

      {/* COMMENT SECTION INTEGRATED */}
      <div className="bg-gray-50/50 dark:bg-black/20 px-4 pb-4 pt-2 border-t border-gray-50 dark:border-neutral-900">
        <div className="text-[11px] font-bold text-gray-400 mb-3 px-1">Tín hiệu phản hồi</div>
        
        <div className="flex items-center gap-2.5 mb-5">
          <UserAvatar userId={currentUser?.id || ''} size="sm" />
          <div className="flex-1 relative group">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder="Gửi bản tin đến phi hành đoàn..."
              className="h-9 bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 hover:border-blue-400 focus:border-blue-500 rounded-xl text-[12px] dark:text-gray-300 transition-all"
              disabled={isSubmitting}
            />
            <button 
              onClick={handleSendComment}
              disabled={!commentText.trim() || isSubmitting}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-30"
            >
              <Send size={14} className={cn(isSubmitting && "animate-pulse")} />
            </button>
          </div>
        </div>

        {/* REAL COMMENTS */}
        <CommentList postId={post.id} limit={2} />
      </div>
    </Card>
  );
}