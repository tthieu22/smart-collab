'use client';

import { useEffect } from 'react';
import type { FeedDataset } from '@smart/types/feed';
import { useFeedStore } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';
import { autoRequest } from '../services/auto.request';

export function useHomeFeedBootstrap() {
  const { isBootstrapped, bootstrap, setLoading, setError } = useFeedStore(
    useShallow((s) => ({
      isBootstrapped: s.isBootstrapped,
      bootstrap: s.bootstrap,
      setLoading: s.setLoading,
      setError: s.setError,
    }))
  );

  useEffect(() => {
    if (isBootstrapped) return;

    const fetchFeed = async () => {
      setLoading(true);
      try {
        const data = await autoRequest<FeedDataset>('/home/feed', {
          method: 'GET',
        });
        bootstrap(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [bootstrap, isBootstrapped, setLoading, setError]);
}
