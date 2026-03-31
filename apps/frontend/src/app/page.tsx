'use client';

import HomeFeedPage from '@smart/components/home/HomeFeedPage';
import { useEffect } from 'react';
import { projectStore } from '@smart/store/project';

export default function HomePage() {
  useEffect(() => {
    projectStore.getState().setActiveProjectId(null);
  }, []);
  return <HomeFeedPage />;
}
