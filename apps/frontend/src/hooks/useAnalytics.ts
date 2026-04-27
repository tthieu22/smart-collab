'use client';

import { useState, useEffect } from 'react';
import { autoRequest } from '../services/auto.request';
import { projectStore } from '../store/project';

import { AnalyticsData } from '@smart/types/project';

export function useAnalytics({ teamId }: { teamId?: string | null }) {
  const storeData = projectStore((s) => s.analyticsData);
  const setStoreData = projectStore((s) => s.setAnalyticsData);

  const [data, setData] = useState<AnalyticsData | null>(storeData);
  const [isLoading, setIsLoading] = useState(!storeData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      // If we already have data in the store, don't fetch unless we want to force refresh
      // or if the data is stale (optionally).
      // Here we check if data exists.
      if (storeData) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await autoRequest<any>('/projects/analytics', {
          method: 'POST',
          body: JSON.stringify({ projectId: teamId }),
        });

        if (res.success) {
          setData(res.data);
          setStoreData(res.data);
        } else {
          setError(res.message || 'Failed to fetch analytics');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [teamId, storeData, setStoreData]);

  return { data: data || storeData, isLoading, error };
}
