'use client';

import { useEffect, useState, useCallback } from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { Loading } from '@smart/components/ui/loading';
import { newsService } from '@smart/services/news.service';
import { useNewsStore } from '@smart/store/news';
import type { NewsArticle } from '@smart/types/ai-autopost';
import { Newspaper, LayoutGrid, Columns, Square } from 'lucide-react';
import { NewsCard } from '@smart/components/news/NewsCard';
import { PremiumPagination } from '@smart/components/ui/PremiumPagination';
import { PageHeader } from '@smart/components/ui/PageHeader';
import { Card } from '@smart/components/ui/card';
import { useUserStore } from '@smart/store/user';
import { Sparkles, Loader2 } from 'lucide-react';
import { message } from 'antd';

export default function NewsPage() {
  const {
    articles,
    total,
    isLoading,
    error,
    fetchPublished
  } = useNewsStore();

  const [gridCols, setGridCols] = useState<1 | 2 | 3>(3);
  const { currentUser, isAdmin: checkIsAdmin } = useUserStore();
  const isAdmin = checkIsAdmin();
  const [isAiPosting, setIsAiPosting] = useState(false);

  // Pagination states
  const [q] = useState('');
  const [page, setPage] = useState(0); // 0-indexed for API
  const [limit] = useState(12);

  useEffect(() => {
    fetchPublished({ page: 0, limit });
  }, [fetchPublished, limit]);

  const handlePageChange = (p: number) => {
    const newPage = p - 1;
    setPage(newPage);
    fetchPublished({ page: newPage, limit });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAiPostNow = async () => {
    if (isAiPosting) return;
    setIsAiPosting(true);
    try {
      const res = await newsService.runAutoPostNow();
      if (res.success) {
        message.success('AI đã tạo bài viết mới thành công!');
        fetchPublished({ page: 0, limit });
      } else {
        message.error(res.message || 'Không thể tạo bài viết AI');
      }
    } catch (err: any) {
      message.error('Lỗi khi gọi AI: ' + err.message);
    } finally {
      setIsAiPosting(false);
    }
  };

  if (isLoading && articles.length === 0) {
    return null;
  }

  const extra = (
    <div className="flex items-center gap-3">
      {isAdmin && (
        <button
          onClick={handleAiPostNow}
          disabled={isAiPosting}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-bold text-sm"
        >
          {isAiPosting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          <span>AI Post News</span>
        </button>
      )}
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
  );

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl space-y-4 pb-10 transition-all duration-500">
        <PageHeader
          icon={<Newspaper className="w-5 h-5" />}
          title="Bản Tin Thiên Hà"
          description="Cập nhật những biến động và tín hiệu mới nhất từ khắp các dải ngân hà."
          extra={extra}
        />

        {error && <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 py-3 px-4 text-sm text-red-600 dark:text-red-400">{error}</Card>}

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
            <div className={`py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl ${gridCols !== 1 ? 'col-span-full' : ''}`}>
              <Newspaper className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-bold text-gray-400">Không tìm thấy tin nào.</p>
            </div>
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
