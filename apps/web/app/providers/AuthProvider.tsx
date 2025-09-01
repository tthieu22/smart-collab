'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/auth';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, isInitialized, initializeAuth, setAccessToken, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      // Chỉ gọi initializeAuth nếu chưa init
      if (!isInitialized) {
        await initializeAuth();
      }

      // Chỉ fetch khi có accessToken sau khi init
      if (useAuthStore.getState().accessToken) {
        console.log('[AuthProvider] Access token found, fetching user...');
        // Gọi fetchMe nếu bạn muốn fetch thêm info user
        // useAuthStore.getState().fetchMe?.();
      }
    };

    initAuth().catch(console.error);
  }, [isInitialized, initializeAuth]);

  return <>{children}</>;
};
