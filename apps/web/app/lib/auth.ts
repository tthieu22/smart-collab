import router from 'next/router';
import { apiClient } from './api';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

class AuthService {
  private static instance: AuthService;
  private user: User | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Token management
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
  }

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
  }

  // Authentication state
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Auth operations
  async login(credentials: LoginCredentials) {
    try {
      const response = await apiClient.login(credentials);

      if (response.success && response.data) {
        this.setToken(response.data.accessToken);
        this.user = response.data.user;
        return { success: true, data: response.data };
      }

      return { success: false, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async register(credentials: RegisterCredentials) {
    try {
      const response = await apiClient.register({
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        email: credentials.email,
        password: credentials.password,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.isAuthenticated()) return null;

    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        this.user = response.data;
        return response.data;
      }
      return null;
    } catch {
      this.logout();
      return null;
    }
  }

  async verifyEmail(email: string, code: string) {
    try {
      const response = await apiClient.verifyEmail({ email, code });
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  logout(): void {
    this.removeToken();
    this.user = null;

    if (typeof window !== 'undefined') {
      // Remove the accessToken cookie used by middleware
      document.cookie = 'accessToken=; path=/; max-age=0; samesite=lax';
      window.location.href = '/';
    }
  }

  // User data
  getUser(): User | null {
    return this.user;
  }

  setUser(user: User): void {
    this.user = user;
  }

  async resendVerificationCode(email: string) {
    try {
      const response = await apiClient.resendVerificationCode(email);
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Resend verification code failed',
      };
    }
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ) {
    try {
      const response = await apiClient.changePassword({
        oldPassword,
        newPassword,
        confirmNewPassword,
      });
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Change password failed',
      };
    }
  }
}

export const authService = AuthService.getInstance();
