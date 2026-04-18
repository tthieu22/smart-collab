'use client';

import { useParams, useRouter } from 'next/navigation';
import PostDetail from '@smart/components/home/feed/PostDetail';
import SiteLayout from '@smart/components/layouts/SiteLayout';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  return (
    <SiteLayout>
      <div className="container py-8 px-4">
        <PostDetail postId={postId} onBack={() => router.back()} />
      </div>
    </SiteLayout>
  );
}
