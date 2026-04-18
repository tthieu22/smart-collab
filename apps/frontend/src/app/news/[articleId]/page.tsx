'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import RightWidgets from '@smart/components/home/widgets/RightWidgets';
import { Loading } from '@smart/components/ui/loading';
import { NewsArticleDetail } from '@smart/components/news/NewsArticleDetail';
import { newsService } from '@smart/services/news.service';
import type { NewsArticle } from '@smart/types/ai-autopost';

export default function NewsArticlePage() {
  const params = useParams();
  const articleId = typeof params.articleId === 'string' ? params.articleId : '';
  const [article, setArticle] = useState<NewsArticle | null | undefined>(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!articleId) {
      setArticle(null);
      setError('Thiếu mã bài viết.');
      return;
    }
    let cancelled = false;
    setError('');
    setArticle(undefined);
    newsService
      .getById(articleId)
      .then((a) => {
        if (!cancelled) {
          setArticle(a);
          if (!a) setError('Không tìm thấy bài viết.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setArticle(null);
          setError('Không thể tải bài viết.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  if (article === undefined) {
    return <Loading fullScreen text="Đang tải bài viết..." />;
  }

  if (!article) {
    return (
      <SiteLayout leftSidebar={<LeftWidgets />} rightSidebar={<RightWidgets />}>
        <div className="mx-auto max-w-[680px] rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300">
          {error || 'Không có dữ liệu.'}
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout leftSidebar={<LeftWidgets />} rightSidebar={<RightWidgets />}>
      <div className="mx-auto w-full max-w-[680px]">
        <NewsArticleDetail article={article} />
      </div>
    </SiteLayout>
  );
}
