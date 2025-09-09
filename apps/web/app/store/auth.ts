import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { authService } from '../services/auth.service';

interface AuthState {
  // State
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Track if we've checked for existing session

  // Actions
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  login: (token: string) => void;
  logout: () => void;
  clearAuth: () => void;
  initializeAuth: () => Promise<boolean>; // Initialize auth from cookie
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial state
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      // Actions
      setAccessToken: (token: string | null) => {
        set({
          accessToken: token,
          isAuthenticated: !!token,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized });
      },

      login: (token: string) => {
        set({
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      clearAuth: () => {
        set({
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Initialize auth from refresh token in cookie
      initializeAuth: async (): Promise<boolean> => {
        const { setLoading, setAccessToken, setInitialized, clearAuth } = get();

        if (get().isInitialized) return true;

        try {
          setLoading(true);

          const response = await authService.refresh();

          if (response.success && response.data?.accessToken) {
            setAccessToken(response.data.accessToken);
            return true;
          }
          throw new Error('No valid refresh token');
        } catch (error) {
          console.log('No valid refresh token found or refresh failed');
          setAccessToken(null);
          clearAuth();
          return false;
        } finally {
          setLoading(false);
          setInitialized(true);
        }
      }
    }),
    {
      name: 'auth-store',
    }
  )
);
