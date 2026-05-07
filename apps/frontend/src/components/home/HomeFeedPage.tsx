'use client';

import SiteLayout from '@smart/components/layouts/SiteLayout';
import FeedComposer from '@smart/components/home/feed/FeedComposer';
import FeedList from '@smart/components/home/feed/FeedList';
import { useHomeFeedBootstrap } from '@smart/hooks/useHomeFeed';
import { UI_CONFIG } from '@smart/lib/constants';
import { cn } from '@smart/lib/utils';

export default function HomeFeedPage() {
  useHomeFeedBootstrap();

  return (
    <SiteLayout>
      <div className={cn(
        UI_CONFIG.CONTAINER,
        UI_CONFIG.MAX_WIDTH.STANDARD,
        UI_CONFIG.PAGE_SPACING
      )}>
        <FeedComposer />
        <FeedList />
      </div>
    </SiteLayout>
  );
}
