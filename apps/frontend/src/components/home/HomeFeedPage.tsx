'use client';

import SiteLayout from '@smart/components/layouts/SiteLayout';
import FeedComposer from '@smart/components/home/feed/FeedComposer';
import FeedList from '@smart/components/home/feed/FeedList';
import { useHomeFeedBootstrap } from '@smart/hooks/useHomeFeed';

export default function HomeFeedPage() {
  useHomeFeedBootstrap();

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl space-y-4 pt-4 pb-10">
        <FeedComposer />
        <FeedList />
      </div>
    </SiteLayout>
  );
}
