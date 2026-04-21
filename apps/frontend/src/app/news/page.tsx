'use client';

import { useEffect, useState, useCallback } from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import { Loading } from '@smart/components/ui/loading';
import { Card } from '@smart/components/ui/card';
import { newsService } from '@smart/services/news.service';
import type { NewsArticle } from '@smart/types/ai-autopost';
import { ChevronLeft, ChevronRight, MessageSquare, LayoutGrid, List as ListIcon, Search } from 'lucide-react';
import { NewsCard } from '@smart/components/news/NewsCard';

export default function NewsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Search & Pagination states
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [goToPageInput, setGoToPageInput] = useState('1');

  const fetchArticles = useCallback(async (p = 0, query = q) => {
    setIsLoading(true);
    try {
      const res = await newsService.listPublished({ page: p, limit, q: query });
      setArticles(res.data);
      setTotalPages(Math.ceil(res.total / limit));
      setPage(res.page);
      setGoToPageInput((res.page + 1).toString());
    } catch (err) {
      setError('Không thể tải danh sách tin tức');
    } finally {
      setIsLoading(false);
    }
  }, [limit, q]);

  useEffect(() => {
    fetchArticles(0);
  }, [fetchArticles]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setQ(searchInput);
    fetchArticles(0, searchInput);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages) return;
    fetchArticles(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(goToPageInput) - 1;
    if (p >= 0 && p < totalPages) {
      handlePageChange(p);
    } else {
      setGoToPageInput((page + 1).toString());
    }
  };

  if (isLoading && articles.length === 0) {
    return <Loading fullScreen text="Đang tải tin tức..." />;
  }

  return (
    <SiteLayout leftSidebar={<LeftWidgets />} hideRightSidebar>
      <div className="mx-auto w-full max-w-5xl space-y-4 pb-10 transition-all duration-500">
        <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/10 shadow-lg shadow-black/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
               </div>
               <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">Tin tức mới nhất</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cập nhật thông tin mới nhất từ hệ thống.
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-2">
               {/* Search Bar */}
               <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tin tức..."
                    className="w-full md:w-64 h-10 rounded-full border-none bg-gray-100 dark:bg-neutral-900 pl-10 pr-4 py-2 text-sm ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
               </form>

               <div className="flex items-center bg-gray-100 dark:bg-neutral-900 p-1 rounded-xl ring-1 ring-black/5">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <ListIcon size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
               </div>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p> : null}
        </Card>

        <div className={`min-h-[500px] ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}`}>
          {isLoading ? (
             <div className={`flex flex-col items-center justify-center py-20 gap-4 opacity-50 ${viewMode === 'grid' ? 'col-span-2' : ''}`}>
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-gray-500">Đang tải...</p>
             </div>
          ) : articles.length === 0 ? (
            <Card padding="small" className={`dark:bg-neutral-950 dark:border-neutral-800 py-20 flex flex-col items-center ${viewMode === 'grid' ? 'col-span-2' : ''}`}>
              <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-bold text-gray-400">Không tìm thấy tin nào.</p>
              {q && (
                <button 
                  onClick={() => { setSearchInput(''); setQ(''); fetchArticles(0, ''); }}
                  className="mt-4 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Xóa tìm kiếm
                </button>
              )}
            </Card>
          ) : (
            articles.map((article) => (
              <NewsCard key={article.id} article={article} variant={viewMode} />
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0 || isLoading}
                className="p-2 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-20 transition-all bg-white dark:bg-neutral-900"
              >
                <ChevronLeft className="w-5 h-5 dark:text-white" />
              </button>
              
              <div className="flex items-center px-4 gap-2">
                <span className="text-sm font-black text-gray-900 dark:text-white">Trang {page + 1}</span>
                <span className="text-sm font-bold text-gray-400">trên {totalPages}</span>
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1 || isLoading}
                className="p-2 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-20 transition-all bg-white dark:bg-neutral-900"
              >
                <ChevronRight className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            <form onSubmit={handleGoToPage} className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Đến trang</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  className="w-16 h-10 rounded-xl border-none bg-white dark:bg-neutral-900 px-3 py-1 text-sm font-bold ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-blue-500 text-center dark:text-white"
                  value={goToPageInput}
                  onChange={(e) => setGoToPageInput(e.target.value)}
                />
                <button 
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-black hover:opacity-80 transition-all uppercase"
                >
                  Đi
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
