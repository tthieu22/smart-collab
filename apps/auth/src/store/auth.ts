import { create } from 'zustand';
import { authService } from '../services/auth.service';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  login: (token: string) => void;
  logout: () => void;
  clearAuth: () => void;
  initializeAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  // Set token & auth status
  setAccessToken: (token: string | null) => {
    set({
      accessToken: token,
      isAuthenticated: !!token,
    });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setInitialized: (initialized: boolean) => set({ isInitialized: initialized }),

  // Login / logout
  login: (token: string) => set({ accessToken: token, isAuthenticated: true, isLoading: false }),
  logout: () => set({ accessToken: null, isAuthenticated: false, isLoading: false }),
  clearAuth: () => set({ accessToken: null, isAuthenticated: false, isLoading: false }),

  // Initialize auth: call refresh API, backend will read httpOnly cookie
  initializeAuth: async (): Promise<boolean> => {
    const { setLoading, setAccessToken, setInitialized, clearAuth } = get();

    if (get().isInitialized) return true;

    setLoading(true);

    try {
      const response = await authService.refresh();

      if (response.success && response.data?.accessToken) {
        setAccessToken(response.data.accessToken);
        return true;
      }

      // Không có access token từ refresh
      clearAuth();
      return false;
    } catch (error) {
      console.log('Refresh token invalid or API failed', error);
      clearAuth();
      return false;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  },
}));
