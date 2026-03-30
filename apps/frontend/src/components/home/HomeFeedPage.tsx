'use client';

import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import RightWidgets from '@smart/components/home/widgets/RightWidgets';
import FeedComposer from '@smart/components/home/feed/FeedComposer';
import FeedList from '@smart/components/home/feed/FeedList';
import { useHomeFeedBootstrap } from '@smart/hooks/useHomeFeed';

export default function HomeFeedPage() {
  useHomeFeedBootstrap();

  return (
    <SiteLayout leftSidebar={<LeftWidgets />} rightSidebar={<RightWidgets />}>
      <div className="mx-auto w-full max-w-[680px] space-y-4">
        <FeedComposer />
        <FeedList />
      </div>
    </SiteLayout>
  );
}

