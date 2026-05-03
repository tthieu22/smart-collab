import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { useUserStore } from './user';
import { getProjectSocketManager } from "./realtime";

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  refreshTimer: NodeJS.Timeout | null;

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
  refreshTimer: null,

  setAccessToken: (token: string | null) => {
    // Xóa timer cũ nếu có
    const currentTimer = get().refreshTimer;
    if (currentTimer) clearTimeout(currentTimer);

    set({ accessToken: token, isAuthenticated: !!token });

    // Nếu có token mới, đặt lịch refresh chủ động
    if (token) {
      try {
        // Giải mã JWT để lấy thời gian hết hạn (exp)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000;
        const timeout = expiresAt - Date.now() - 30000; // Refresh trước 30 giây

        if (timeout > 0) {
          const timer = setTimeout(() => {
            get().initializeAuth();
          }, timeout);
          set({ refreshTimer: timer });
        }
      } catch (e) {
        console.error("Failed to set refresh timer", e);
      }
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setInitialized: (initialized: boolean) => set({ isInitialized: initialized }),

  login: async (token: string) => {
    const { setCurrentUser } = useUserStore.getState();
    set({ accessToken: token, isAuthenticated: true, isLoading: true });

    try {
      const response = await authService.me();
      if (response.success && response.data) {
        setCurrentUser(response.data);
      }
    } finally {
      set({ isLoading: false });
    }

    const socketManager = getProjectSocketManager();
    socketManager.initSocket();
  },

  logout: () => {
    const currentTimer = get().refreshTimer;
    if (currentTimer) clearTimeout(currentTimer);
    
    set({ accessToken: null, isAuthenticated: false, isLoading: false, refreshTimer: null });
    const socketManager = getProjectSocketManager();
    socketManager.disconnect();
  },

  clearAuth: () => {
    const currentTimer = get().refreshTimer;
    if (currentTimer) clearTimeout(currentTimer);

    set({ accessToken: null, isAuthenticated: false, isLoading: false, refreshTimer: null });
    const socketManager = getProjectSocketManager();
    socketManager.disconnect();
  },

  initializeAuth: async (): Promise<boolean> => {
    const { setLoading, setAccessToken, setInitialized, clearAuth } = get();

    // Lưu ý: Không chặn nếu đã initialized vì đây là hàm dùng chung cho cả auto-refresh
    setLoading(true);

    try {
      const response = await authService.refresh();

      if (response.success && response.data?.accessToken) {
        // Hàm setAccessToken ở trên sẽ tự động đặt lại Timer mới
        setAccessToken(response.data.accessToken);

        const socketManager = getProjectSocketManager();
        socketManager.initSocket();

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
