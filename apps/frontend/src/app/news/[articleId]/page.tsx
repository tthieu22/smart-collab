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
      <SiteLayout hideLeftSidebar hideRightSidebar>
        <div className="mx-auto max-w-4xl pt-20 flex flex-col items-center justify-center text-center gap-4">
          <div className="text-4xl font-black text-gray-200 dark:text-neutral-800">404</div>
          <p className="text-lg font-bold text-gray-500">{error || 'Không tìm thấy bài viết.'}</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout hideLeftSidebar hideRightSidebar>
      <div className="w-full font-sans">
        <NewsArticleDetail article={article} />
      </div>
    </SiteLayout>
  );
}
