'use client';

import { useEffect } from 'react';
import type { FeedDataset } from '@smart/types/feed';
import { useFeedStore } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';
import { autoRequest } from '../services/auto.request';

export function useHomeFeedBootstrap() {
  const { bootstrap, setLoading, setError } = useFeedStore(
    useShallow((s) => ({
      bootstrap: s.bootstrap,
      setLoading: s.setLoading,
      setError: s.setError,
    }))
  );

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const response = await autoRequest<{ success: boolean; data: FeedDataset }>('/home/feed', {
          method: 'GET',
        });
        bootstrap(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [bootstrap, setLoading, setError]);
}
