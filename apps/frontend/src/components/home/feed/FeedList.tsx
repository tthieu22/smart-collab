'use client';

import { useFeedStore } from '@smart/store/feed';
import FeedPostCard from './FeedPostCard';

export default function FeedList() {
  const postIds = useFeedStore((s) => s.postIds);

  return (
    <div className="space-y-4">
      {postIds.map((id) => (
        <FeedPostCard key={id} postId={id} />
      ))}
    </div>
  );
}

