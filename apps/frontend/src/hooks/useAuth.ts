'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { useUserStore } from '../store/user';
import { autoRequest } from '../services/auto.request';
import { ROUTES } from '../lib/constants';

export const useAuth = () => {
  const router = useRouter();
  const {
    accessToken,
    isAuthenticated,
    isLoading,
    isInitialized,
    setLoading,
    logout: storeLogout,
    setAccessToken,
    clearAuth,
    initializeAuth,
  } = useAuthStore();

  const {
    currentUser,
    setCurrentUser,
    clearUserStore,
    setUserInitialized,
    isUserInitialized,
  } = useUserStore();

  const [isFetchingUser, setIsFetchingUser] = useState(false);

  /** Fetch current user using autoRequest */
  const fetchUser = useCallback(async () => {
    if (!accessToken || isFetchingUser) return currentUser || null;

    setIsFetchingUser(true);
    try {
      const response = await autoRequest<{ success: boolean; data: any; message?: string }>('/auth/me');
      if (response.success && response.data) {
        setCurrentUser(response.data);
        return response.data;
      } else {
        clearAuth();
        clearUserStore();
        router.push(ROUTES.LOGIN);
        return null;
      }
    } catch (error) {
      console.error('Fetch user failed:', error);
      clearAuth();
      clearUserStore();
      router.push(ROUTES.LOGIN);
      return null;
    } finally {
      setIsFetchingUser(false);
      setUserInitialized(true);
    }
  }, [
    accessToken,
    isFetchingUser,
    setCurrentUser,
    setUserInitialized,
    clearAuth,
    clearUserStore,
    router,
    currentUser,
  ]);

  /** Logout */
  const logout = useCallback(async () => {
    try {
      await autoRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      storeLogout();
      clearUserStore();
      router.push(ROUTES.LOGIN);
    }
  }, [storeLogout, clearUserStore, router]);

  /** OAuth exchange */
  const oauthExchange = useCallback(
    async (code: string) => {
      try {
        setLoading(true);
        const response = await autoRequest<{ success: boolean; data?: any; message?: string }>('/auth/oauth-exchange', {
          method: 'POST',
          body: JSON.stringify({ code }),
        });

        if (response.success && response.data?.accessToken) {
          setAccessToken(response.data.accessToken);
          await fetchUser();
          router.push(ROUTES.DASHBOARD);
          return { success: true };
        }

        return { success: false, message: response.message };
      } catch (error) {
        console.error('OAuth exchange failed:', error);
        return { success: false, message: error instanceof Error ? error.message : 'OAuth exchange failed' };
      } finally {
        setLoading(false);
      }
    },
    [setAccessToken, fetchUser, setLoading, router]
  );

  /** Init auth on mount */
  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized, initializeAuth]);

  /** Auto-fetch user when accessToken exists */
  useEffect(() => {
    if (isInitialized && accessToken && !isUserInitialized) {
      fetchUser().catch(console.error);
    }
  }, [isInitialized, accessToken, isUserInitialized, fetchUser]);

  return {
    accessToken,
    user: currentUser,
    isAuthenticated,
    isLoading,
    isInitialized,
    isUserInitialized,
    logout,
    oauthExchange,
    fetchUser,
  };
};
