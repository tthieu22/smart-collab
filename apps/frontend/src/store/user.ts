import { create } from 'zustand';
import { User } from '../types/auth';

interface UserState {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  isUserInitialized: boolean;
  suggestedUsers: any[];
  suggestedUsersData: {
    items: any[];
    total: number;
    page: number;
    limit: number;
  } | null;
  setSuggestedUsers: (users: any[]) => void;
  setSuggestedUsersData: (data: { items: any[]; total: number; page: number; limit: number }) => void;
  
  query: string;
  setQuery: (q: string) => void;

  setCurrentUser: (user: User | null) => void;
  setAllUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, user: User) => void;
  removeUser: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  setInitialized: (initialized: boolean) => void;
  setUserInitialized: (initialized: boolean) => void;
  clearUserStore: () => void;
  isAdmin: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  allUsers: [],
  suggestedUsers: [],
  suggestedUsersData: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  isUserInitialized: false,
  query: "",

  setSuggestedUsers: (users) => set({ suggestedUsers: users }),
  setSuggestedUsersData: (data) => set({ suggestedUsersData: data, suggestedUsers: data.items }),
  setQuery: (q) => set({ query: q }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setAllUsers: (users) => set({ allUsers: users }),
  addUser: (user) => set((state) => ({ allUsers: [...state.allUsers, user] })),
  updateUser: (id, updatedUser) =>
    set((state) => ({
      allUsers: state.allUsers.map((u) => (u.id === id ? updatedUser : u)),
      currentUser:
        state.currentUser?.id === id ? updatedUser : state.currentUser,
    })),
  removeUser: (id) =>
    set((state) => ({
      allUsers: state.allUsers.filter((u) => u.id !== id),
      currentUser: state.currentUser?.id === id ? null : state.currentUser,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setUserInitialized: (initialized) => set({ isUserInitialized: initialized }),
  clearUserStore: () =>
    set({
      currentUser: null,
      allUsers: [],
      isLoading: false,
      error: null,
      isInitialized: false,
      isUserInitialized: false,
    }),
  isAdmin: () => String(get().currentUser?.role || '').toUpperCase() === 'ADMIN',
}));
