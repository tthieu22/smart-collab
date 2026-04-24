'use client';

import { useParams, useRouter } from 'next/navigation';
import PostDetail from '@smart/components/home/feed/PostDetail';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@smart/components/ui/PageHeader';
import { Button } from 'antd';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const extra = (
    <Button 
      onClick={() => router.back()} 
      icon={<ArrowLeft size={16} />}
      className="flex items-center gap-2 dark:bg-neutral-900 dark:border-neutral-800 h-10 rounded-xl font-medium border-none shadow-sm ring-1 ring-black/5 dark:ring-white/10"
    >
      Quay lại
    </Button>
  );

  return (
    <SiteLayout hideFooter>
      <div className="mx-auto w-full max-w-5xl space-y-4 pb-10 pt-4">
        <PageHeader
          icon={<MessageSquare className="w-5 h-5" />}
          title="Chi tiết bài viết"
          description="Xem nội dung và thảo luận cùng mọi người trong cộng đồng."
          extra={extra}
        />

        <div className="min-h-[600px]">
          <PostDetail postId={postId} onBack={() => router.back()} />
        </div>
      </div>
    </SiteLayout>
  );
}
