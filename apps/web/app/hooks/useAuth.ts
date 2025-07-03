"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService, type User } from "@/app/lib/auth";
import { ROUTES } from "@/app/lib/constants";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  register: (userData: any) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  getUserInfo: () => Promise<User | null>;
  changePassword: (
    oldPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ) => Promise<{ success: boolean; message: string }>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isAuthenticated = authService.isAuthenticated();

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      setError("Failed to load user data");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await authService.login({ email, password });

        if (result.success) {
          if (result.data && result.data.user) {
            setUser(result.data.user);
          } else {
            await refreshUser();
          }
          return { success: true, message: "Login successful" };
        } else {
          setError(result.message || "Login failed");
          return { success: false, message: result.message || "Login failed" };
        }
      } catch (err) {
        const errorMessage = "Login failed";
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [refreshUser]
  );

  const register = useCallback(async (userData: any) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.register(userData);
      if (result.success) {
        return { success: true, message: "Registration successful" };
      } else {
        setError(result.message || "Registration failed");
        return {
          success: false,
          message: result.message || "Registration failed",
        };
      }
    } catch (err) {
      const errorMessage = "Registration failed";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
    router.push(ROUTES.LOGIN);
  }, [router]);

  const getUserInfo = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      return currentUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const changePassword = useCallback(
    async (
      oldPassword: string,
      newPassword: string,
      confirmNewPassword: string
    ) => {
      try {
        const result = await authService.changePassword(
          oldPassword,
          newPassword,
          confirmNewPassword
        );
        return result;
      } catch (err) {
        const errorMessage = "Change password failed";
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
    },
    []
  );

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    getUserInfo,
    changePassword,
  };
}
