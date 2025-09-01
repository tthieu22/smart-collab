'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { useUserStore } from '../store/user';
import { authService } from '../services/auth.service';
import { LoginCredentials } from '../types/auth';
import { ROUTES } from '../lib/constants';

export const useAuth = () => {
  const router = useRouter();
  const {
    accessToken,
    isAuthenticated,
    isLoading,
    isInitialized,
    setLoading,
    login: storeLogin,
    logout: storeLogout,
    setAccessToken,
    clearAuth,
    initializeAuth,
  } = useAuthStore();

  const { currentUser, setCurrentUser, clearUserStore, setInitialized: setUserInitialized } =
    useUserStore();

  const [isFetchingUser, setIsFetchingUser] = useState(false);

  /** Refresh token */
  const refreshToken = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.refresh();
      if (response.success && response.data?.accessToken) {
        setAccessToken(response.data.accessToken);
        return response.data.accessToken;
      } else {
        throw new Error(response.message || 'Failed to refresh token');
      }
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

  /** Ensure token is valid */
  const ensureValidToken = useCallback(async () => {
    if (!accessToken) return null;
    if (authService.isTokenExpired(accessToken)) {
      return await refreshToken();
    }
    return accessToken;
  }, [accessToken, refreshToken]);

  /** Fetch current user */
  const fetchUser = useCallback(async () => {
    if (!accessToken || currentUser || isFetchingUser) return currentUser || null;

    setIsFetchingUser(true);
    try {
      const validToken = await ensureValidToken();
      if (!validToken) return null;

      const response = await authService.me(validToken);
      if (response.success && response.data) {
        setCurrentUser(response.data);
        setUserInitialized(true);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch user');
      }
    } catch (error) {
      console.error('Fetch user failed:', error);
      clearAuth();
      clearUserStore();
      router.push(ROUTES.LOGIN);
      return null;
    } finally {
      setIsFetchingUser(false);
    }
  }, [accessToken, currentUser, isFetchingUser, ensureValidToken, setCurrentUser, setUserInitialized, clearAuth, clearUserStore, router]);

  /** Login */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setLoading(true);
        const response = await authService.login(credentials);
        if (response.success && response.data) {
          storeLogin(response.data.accessToken);
          setCurrentUser(response.data.user);
          setUserInitialized(true);
          router.push(ROUTES.DASHBOARD);
          return { success: true };
        } else {
          return { success: false, message: response.message };
        }
      } catch (error) {
        console.error('Login failed:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Login failed' };
      } finally {
        setLoading(false);
      }
    },
    [storeLogin, setCurrentUser, setLoading, router, setUserInitialized]
  );

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
        } else {
          return { success: false, message: response.message };
        }
      } catch (error) {
        console.error('OAuth exchange failed:', error);
        return { success: false, message: error instanceof Error ? error.message : 'OAuth exchange failed' };
      } finally {
        setLoading(false);
      }
    },
    [setAccessToken, fetchUser, setLoading, router]
  );

  /** Initialize auth on mount */
  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized, initializeAuth]);

  /** Auto-fetch user when accessToken exists and user not loaded */
  useEffect(() => {
    fetchUser().catch(console.error);
  }, [accessToken, isInitialized, fetchUser]);

  return {
    accessToken,
    user: currentUser,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    logout,
    oauthExchange,
    fetchUser,
    refreshToken,
    ensureValidToken,
  };
};
