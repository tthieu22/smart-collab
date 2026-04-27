'use client';

import { useState, useEffect } from 'react';
import { autoRequest } from '../services/auto.request';

interface AnalyticsData {
  boost: number;
  completed: number;
  target: number;
  isTeamMode: boolean;
  trend: 'up' | 'down' | 'neutral';
  topPerformer?: { name: string; avatar: string; count: number } | null;
  streak?: number;
  dailyStats: Array<{ date: string; completed: number; created: number }>;
}

export function useAnalytics({ teamId }: { teamId?: string | null }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      try {
        const res = await autoRequest<any>('/projects/analytics', {
          method: 'POST',
          body: JSON.stringify({ projectId: teamId }),
        });

        if (res.success) {
          setData(res.data);
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
  }, [teamId]);

  return { data, isLoading, error };
}
