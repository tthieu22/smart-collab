import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { useUserStore } from './user';
import { getProjectSocketManager } from "./realtime"; // dùng getter thay vì import instance trực tiếp

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
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setAccessToken: (token: string | null) => {
    set({ accessToken: token, isAuthenticated: !!token });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setInitialized: (initialized: boolean) => set({ isInitialized: initialized }),

  login: async (token: string) => {
    const { setCurrentUser } = useUserStore.getState();
    set({ accessToken: token, isAuthenticated: true, isLoading: true });

    try {
      const response = await authService.me(token);
      if (response.success && response.data) {
        setCurrentUser(response.data);
      }
    } finally {
      set({ isLoading: false });
    }

    // Lazy-init socket
    const socketManager = getProjectSocketManager();
    socketManager.initSocket(token);
  },

  logout: () => {
    set({ accessToken: null, isAuthenticated: false, isLoading: false });

    const socketManager = getProjectSocketManager();
    socketManager.disconnect();
  },

  clearAuth: () => {
    set({ accessToken: null, isAuthenticated: false, isLoading: false });

    const socketManager = getProjectSocketManager();
    socketManager.disconnect();
  },

  initializeAuth: async (): Promise<boolean> => {
    const { setLoading, setAccessToken, setInitialized, clearAuth } = get();

    if (get().isInitialized) return true;

    setLoading(true);

    try {
      const response = await authService.refresh();

      if (response.success && response.data?.accessToken) {
        setAccessToken(response.data.accessToken);

        const socketManager = getProjectSocketManager();
        socketManager.initSocket(response.data.accessToken);

        return true;
      }

      clearAuth();
      return false;
    } catch (error) {
      console.log("Refresh token invalid or API failed", error);
      clearAuth();
      return false;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  },
}));
