'use client';

import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import RightWidgets from '@smart/components/home/widgets/RightWidgets';
import { useHomeFeedBootstrap } from '@smart/hooks/useHomeFeed';
import { useFeedStore } from '@smart/store/feed';
import FeedPostCard from '@smart/components/home/feed/FeedPostCard';
import { Card } from '@smart/components/ui/card';

export default function UserProfilePage({ userId }: { userId?: string }) {
  useHomeFeedBootstrap();

  const currentUserId = useFeedStore((s) => s.currentUserId);
  const users = useFeedStore((s) => s.users);
  const posts = useFeedStore((s) => s.posts);
  const postIds = useFeedStore((s) => s.postIds);

  const targetUserId = userId || currentUserId || '';
  const profileUser = targetUserId ? users[targetUserId] : null;
  const userPosts = postIds.filter((pid) => posts[pid]?.authorId === targetUserId);
  const isMe = Boolean(currentUserId && targetUserId && currentUserId === targetUserId);

  return (
    <SiteLayout leftSidebar={<LeftWidgets />} rightSidebar={<RightWidgets />}>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Card
          padding="small"
          className="overflow-visible dark:bg-neutral-950 dark:border-neutral-800"
        >
          <div className="relative z-0 h-40 w-full rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
          <div className="-mt-10 px-4 pb-2 relative z-10">
            <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-gray-200 dark:border-neutral-950 dark:bg-neutral-800">
              {profileUser?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileUser.avatarUrl} alt={profileUser.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="mt-2">
              <h1 className="text-xl font-semibold">{profileUser?.name || 'Người dùng'}</h1>
              <p className="text-sm text-gray-500">@{profileUser?.username || 'unknown'}</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {userPosts.length} bài viết công khai trên trang cá nhân.
              </p>
            </div>
          </div>
        </Card>

        <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
          <div className="text-base font-semibold">{isMe ? 'Bài viết của bạn' : 'Bài viết người dùng'}</div>
        </Card>

        <div className="space-y-4">
          {userPosts.length ? (
            userPosts.map((pid) => <FeedPostCard key={pid} postId={pid} />)
          ) : (
            <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
              <div className="text-sm text-gray-500">Người dùng chưa có bài viết nào.</div>
            </Card>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

