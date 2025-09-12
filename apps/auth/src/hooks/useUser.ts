'use client';

import { useCallback } from 'react';
import { useUserStore } from '../store/user';
import { useAuthStore } from '../store/auth';
import { userService } from '../services/user.service';
import {
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  ResendVerificationRequest,
  VerifyEmailRequest,
} from '../types/user';

export const useUser = () => {
  const {
    currentUser,
    allUsers,
    isLoading,
    error,
    setCurrentUser,
    setAllUsers,
    addUser,
    updateUser,
    removeUser,
    setLoading,
    setError,
    clearError,
    clearUserStore,
  } = useUserStore();

  const { accessToken } = useAuthStore();

  // Helper function to check if we have a valid token
  const ensureValidToken = useCallback(() => {
    if (!accessToken) {
      setError('No access token available');
      return false;
    }
    return true;
  }, [accessToken, setError]);

  // Get current user
  const getMe = useCallback(async () => {
    if (!ensureValidToken()) return null;

    try {
      setLoading(true);
      clearError();
      const response = await userService.getMe(accessToken!);

      if (response.success && response.data) {
        setCurrentUser(response.data);
        return response.data;
      } else {
        setError(response.message || 'Failed to fetch user');
        return null;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch user';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    setCurrentUser,
    setLoading,
    setError,
    clearError,
    ensureValidToken,
  ]);

  // Update current user
  const updateMe = useCallback(
    async (request: UpdateUserRequest) => {
      if (!ensureValidToken()) {
        return { success: false, message: 'No access token available' };
      }

      try {
        setLoading(true);
        clearError();
        const response = await userService.updateMe(request, accessToken!);

        if (response.success && response.data) {
          setCurrentUser(response.data);
          return { success: true, data: response.data };
        } else {
          setError(response.message || 'Failed to update user');
          return { success: false, message: response.message };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update user';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [
      accessToken,
      setCurrentUser,
      setLoading,
      setError,
      clearError,
      ensureValidToken,
    ]
  );

  // Change password
  const changePassword = useCallback(
    async (request: ChangePasswordRequest) => {
      if (!ensureValidToken()) {
        return { success: false, message: 'No access token available' };
      }

      try {
        setLoading(true);
        clearError();
        const response = await userService.changePassword(
          request,
          accessToken!
        );

        if (response.success) {
          return { success: true, message: response.message };
        } else {
          setError(response.message || 'Failed to change password');
          return { success: false, message: response.message };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to change password';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [accessToken, setLoading, setError, clearError, ensureValidToken]
  );

  // Get all users (admin only)
  const getAllUsers = useCallback(async () => {
    if (!ensureValidToken()) return null;

    try {
      setLoading(true);
      clearError();
      const response = await userService.getAllUsers(accessToken!);

      if (response.success && response.data) {
        setAllUsers(response.data);
        return response.data;
      } else {
        setError(response.message || 'Failed to fetch users');
        return null;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch users';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    setAllUsers,
    setLoading,
    setError,
    clearError,
    ensureValidToken,
  ]);

  // Create user (admin only)
  const createUser = useCallback(
    async (request: CreateUserRequest) => {
      if (!ensureValidToken()) {
        return { success: false, message: 'No access token available' };
      }

      try {
        setLoading(true);
        clearError();
        const response = await userService.createUser(request, accessToken!);

        if (response.success && response.data) {
          addUser(response.data);
          return { success: true, data: response.data };
        } else {
          setError(response.message || 'Failed to create user');
          return { success: false, message: response.message };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create user';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [accessToken, addUser, setLoading, setError, clearError, ensureValidToken]
  );

  // Update user by ID (admin only)
  const updateUserById = useCallback(
    async (id: string, request: UpdateUserRequest) => {
      if (!ensureValidToken()) {
        return { success: false, message: 'No access token available' };
      }

      try {
        setLoading(true);
        clearError();
        const response = await userService.updateUser(
          id,
          request,
          accessToken!
        );

        if (response.success && response.data) {
          updateUser(id, response.data);
          return { success: true, data: response.data };
        } else {
          setError(response.message || 'Failed to update user');
          return { success: false, message: response.message };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update user';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [
      accessToken,
      updateUser,
      setLoading,
      setError,
      clearError,
      ensureValidToken,
    ]
  );

  // Delete user by ID (admin only)
  const deleteUserById = useCallback(
    async (id: string) => {
      if (!ensureValidToken()) {
        return { success: false, message: 'No access token available' };
      }

      try {
        setLoading(true);
        clearError();
        const response = await userService.deleteUser(id, accessToken!);

        if (response.success) {
          removeUser(id);
          return { success: true, message: 'User deleted successfully' };
        } else {
          setError(response.message || 'Failed to delete user');
          return { success: false, message: response.message };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete user';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [
      accessToken,
      removeUser,
      setLoading,
      setError,
      clearError,
      ensureValidToken,
    ]
  );

  // Resend verification code
  const resendVerificationCode = useCallback(
    async (request: ResendVerificationRequest) => {
      try {
        setLoading(true);
        clearError();
        const response = await userService.resendVerificationCode(request);

        if (response.success) {
          return { success: true, message: response.message };
        } else {
          setError(response.message || 'Failed to resend verification code');
          return { success: false, message: response.message };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to resend verification code';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, clearError]
  );

  // Verify email
  const verifyEmail = useCallback(
    async (request: VerifyEmailRequest) => {
      try {
        setLoading(true);
        clearError();
        const response = await userService.verifyEmail(request);

        if (response.success) {
          return { success: true, message: response.message };
        } else {
          setError(response.message || 'Failed to verify email');
          return { success: false, message: response.message };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to verify email';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, clearError]
  );

  return {
    // State
    currentUser,
    allUsers,
    isLoading,
    error,

    // Actions
    getMe,
    updateMe,
    changePassword,
    getAllUsers,
    createUser,
    updateUserById,
    deleteUserById,
    resendVerificationCode,
    verifyEmail,
    clearError,
    clearUserStore,
  };
};
