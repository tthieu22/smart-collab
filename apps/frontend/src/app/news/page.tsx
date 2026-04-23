'use client';

import { useEffect, useState, useCallback } from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import { Loading } from '@smart/components/ui/loading';
import { Card } from '@smart/components/ui/card';
import { newsService } from '@smart/services/news.service';
import type { NewsArticle } from '@smart/types/ai-autopost';
import { Newspaper, LayoutGrid, Columns, Square } from 'lucide-react';
import { NewsCard } from '@smart/components/news/NewsCard';
import { PremiumPagination } from '@smart/components/ui/PremiumPagination';

export default function NewsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [error, setError] = useState('');
  const [gridCols, setGridCols] = useState<1 | 2 | 3>(3);

  // Pagination states
  const [q] = useState('');
  const [page, setPage] = useState(0); // 0-indexed for API
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);

  const fetchArticles = useCallback(async (p = 0, query = q) => {
    setIsLoading(true);
    try {
      const res = await newsService.listPublished({ page: p, limit, q: query });
      setArticles(res.data);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      setError('Không thể tải danh sách tin tức');
    } finally {
      setIsLoading(false);
    }
  }, [limit, q]);

  useEffect(() => {
    fetchArticles(0);
  }, [fetchArticles]);

  const handlePageChange = (p: number) => {
    // antd pagination is 1-indexed, API is 0-indexed
    fetchArticles(p - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading && articles.length === 0) {
    return <Loading fullScreen text="Đang tải tin tức..." />;
  }

  return (
    <SiteLayout leftSidebar={<LeftWidgets />} hideRightSidebar>
      <div className="mx-auto w-full max-w-5xl space-y-4 pb-10 transition-all duration-500 pt-4">
        <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/10 shadow-lg shadow-black/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Newspaper className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Tin tức mới nhất</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quản lý và theo dõi các tin tức, bài viết mới nhất từ hệ thống.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100 dark:bg-neutral-900 p-1 rounded-xl ring-1 ring-black/5">
                <button
                  onClick={() => setGridCols(1)}
                  className={`p-2 rounded-lg transition-all ${gridCols === 1 ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
                  title="1 Column"
                >
                  <Square size={18} />
                </button>
                <button
                  onClick={() => setGridCols(2)}
                  className={`p-2 rounded-lg transition-all ${gridCols === 2 ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
                  title="2 Columns"
                >
                  <Columns size={18} />
                </button>
                <button
                  onClick={() => setGridCols(3)}
                  className={`p-2 rounded-lg transition-all ${gridCols === 3 ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
                  title="3 Columns"
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p> : null}
        </Card>

        <div className={`min-h-[500px] ${gridCols === 1
            ? 'space-y-4'
            : gridCols === 2
              ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
          }`}>
          {isLoading ? (
            <div className={`flex flex-col items-center justify-center py-20 gap-4 opacity-50 ${gridCols !== 1 ? 'col-span-full' : ''}`}>
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-gray-500">Đang tải...</p>
            </div>
          ) : articles.length === 0 ? (
            <Card padding="small" className={`dark:bg-neutral-950 dark:border-neutral-800 py-20 flex flex-col items-center ${gridCols !== 1 ? 'col-span-full' : ''}`}>
              <Newspaper className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-bold text-gray-400">Không tìm thấy tin nào.</p>
            </Card>
          ) : (
            articles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                variant={gridCols === 1 ? 'list' : 'grid'}
              />
            ))
          )}
        </div>

        <PremiumPagination
          current={page + 1}
          total={total}
          pageSize={limit}
          onChange={handlePageChange}
        />
      </div>
    </SiteLayout>
  );
}
