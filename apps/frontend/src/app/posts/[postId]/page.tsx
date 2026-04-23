'use client';

import { useParams, useRouter } from 'next/navigation';
import PostDetail from '@smart/components/home/feed/PostDetail';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import { Card } from '@smart/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  return (
    <SiteLayout leftSidebar={<LeftWidgets />} hideRightSidebar hideFooter>
      <div className="mx-auto w-full max-w-5xl space-y-4 pb-10 pt-4">
        {/* Header section consistent with other pages */}
        <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/10 shadow-lg shadow-black/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Chi tiết bài viết
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Xem nội dung và thảo luận cùng mọi người.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <PostDetail postId={postId} onBack={() => router.back()} />
      </div>
    </SiteLayout>
  );
}
