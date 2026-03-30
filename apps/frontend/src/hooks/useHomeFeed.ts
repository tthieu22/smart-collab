'use client';

import { useEffect, useMemo } from 'react';
import type { FeedDataset } from '@smart/types/feed';
import { useFeedStore } from '@smart/store/feed';
import homeFeedJson from '@smart/mock/home-feed.json';

function asDataset(data: unknown): FeedDataset {
  return data as FeedDataset;
}

export function useHomeFeedBootstrap() {
  const isBootstrapped = useFeedStore((s) => s.isBootstrapped);
  const bootstrap = useFeedStore((s) => s.bootstrap);

  const dataset = useMemo(() => asDataset(homeFeedJson), []);

  useEffect(() => {
    if (!isBootstrapped) bootstrap(dataset);
  }, [bootstrap, dataset, isBootstrapped]);
}

