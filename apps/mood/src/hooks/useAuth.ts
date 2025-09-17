'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { useUserStore } from '../store/user';
import { authService } from '../services/auth.service';
import { ROUTES } from '../lib/constants';

export const useAuth = () => {
  const router = useRouter();
  const {
    accessToken,
    isAuthenticated,
    isLoading,
    isInitialized, // ✅ auth init
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

  /** Refresh token */
  const refreshToken = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.refresh();
      if (response.success && response.data?.accessToken) {
        setAccessToken(response.data.accessToken);
        return response.data.accessToken;
      }
      throw new Error(response.message || 'Failed to refresh token');
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuth();
      clearUserStore();
      router.push(ROUTES.LOGIN);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setAccessToken, clearAuth, clearUserStore, router]);

  /** Ensure token valid */
  const ensureValidToken = useCallback(async () => {
    if (!accessToken) return null;
    if (authService.isTokenExpired(accessToken)) {
      return await refreshToken();
    }
    return accessToken;
  }, [accessToken, refreshToken]);

  /** Fetch current user */
  const fetchUser = useCallback(async () => {
    if (!accessToken || isFetchingUser) return currentUser || null;

    setIsFetchingUser(true);
    try {
      const validToken = await ensureValidToken();
      if (!validToken) return null;

      const response = await authService.me(validToken);
      if (response.success && response.data) {
        setCurrentUser(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Fetch user failed:', error);
      clearAuth();
      clearUserStore();
      router.push(ROUTES.LOGIN);
      return null;
    } finally {
      setIsFetchingUser(false);
      setUserInitialized(true); // ✅ luôn đánh dấu user init
    }
  }, [
    accessToken,
    isFetchingUser,
    ensureValidToken,
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
      if (accessToken) await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      storeLogout();
      clearUserStore();
      router.push(ROUTES.LOGIN);
    }
  }, [accessToken, storeLogout, clearUserStore, router]);

  /** OAuth exchange */
  const oauthExchange = useCallback(
    async (code: string) => {
      try {
        setLoading(true);
        const response = await authService.oauthExchange(code);
        if (response.success && response.data?.accessToken) {
          setAccessToken(response.data.accessToken);
          await fetchUser();
          router.push(ROUTES.DASHBOARD);
          return { success: true };
        }
        return { success: false, message: response.message };
      } catch (error) {
        console.error('OAuth exchange failed:', error);
        return {
          success: false,
          message:
            error instanceof Error ? error.message : 'OAuth exchange failed',
        };
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
    refreshToken,
    ensureValidToken,
  };
};
