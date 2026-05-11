'use client';

import { useEffect, useRef } from 'react';
import { useFeedStore } from '@smart/store/feed';
import FeedPostCard from './FeedPostCard';
import { Spin } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { SwitcherOutlined } from '@ant-design/icons';

export default function FeedList() {
  const { postIds, isLoading, hasMore, fetchNextPage, reloadFeed } = useFeedStore();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({ hasMore, isLoading, postIdsLength: postIds.length });
  useEffect(() => {
    stateRef.current = { hasMore, isLoading, postIdsLength: postIds.length };
  }, [hasMore, isLoading, postIds.length]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      const state = stateRef.current;
      if (target.isIntersecting && state.hasMore && !state.isLoading && state.postIdsLength > 0) {
        fetchNextPage();
      }
    }, {
      rootMargin: '400px',
      threshold: 0.1
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage]);

  return (
    <div className="space-y-6 pb-20 relative min-h-[500px]">
      {/* Pull to Refresh / Top Loading Indicator */}
      {isLoading && postIds.length === 0 && (
        <div className="overflow-hidden py-10 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-blue-500/20 rounded-full animate-pulse" />
            <Spin size="large" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-neutral-700 dark:text-neutral-200 font-semibold tracking-tight">Đang tải bài viết mới...</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 animate-pulse">Vui lòng chờ trong giây lát...</p>
          </div>
        </div>
      )}

      {postIds.map((id) => (
        <FeedPostCard key={id} postId={id} />
      ))}

      {/* Loading Sentinel */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-10">
          {isLoading ? (
            <div className="w-full space-y-4">
              <div className="w-full bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm animate-pulse space-y-4 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-800 rounded-full" />
                  <div className="space-y-2">
                    <div className="w-24 h-3 bg-gray-200 dark:bg-neutral-800 rounded" />
                    <div className="w-16 h-2 bg-gray-200 dark:bg-neutral-800 rounded" />
                  </div>
                </div>
                <div className="w-full h-32 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
              </div>
            </div>
          ) : (
            /* Invisible sentinel to trigger next load */
            <div className="h-10 w-full" />
          )}
        </div>
      )}

      {!hasMore && postIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 text-center"
        >
          <div className="inline-block px-10 py-8 bg-white dark:bg-neutral-900 rounded-[32px] shadow-xl border border-neutral-100 dark:border-neutral-800 max-w-sm mx-auto">
            <div className="text-4xl mb-4 animate-bounce">✨</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Bạn đã xem hết bài viết!</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              Tất cả bài viết mới nhất đã được hiển thị. Hãy quay lại sau để cập nhật thêm.
            </p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Delay reload until scroll starts to prevent layout jump at the bottom
                setTimeout(() => {
                  reloadFeed();
                }, 400);
              }}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <SwitcherOutlined />
              Tải lại bảng tin
            </button>
          </div>
        </motion.div>
      )}

      {!hasMore && postIds.length === 0 && !isLoading && (
        <div className="py-20 text-center text-neutral-500 dark:text-neutral-400">
          <p className="text-lg font-medium">Hiện tại chưa có bài viết nào mới.</p>
          <p className="text-sm opacity-60 mt-1">Hãy theo dõi thêm người dùng khác để xem bài viết của họ!</p>
        </div>
      )}
    </div>
  );
}

