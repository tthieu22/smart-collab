import { create } from 'zustand';
import { User } from '../types/auth';

interface UserState {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // ✅ auth init
  isUserInitialized: boolean; // ✅ user init riêng

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
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  allUsers: [],
  isLoading: false,
  error: null,
  isInitialized: false,
  isUserInitialized: false, // ✅ thêm

  setCurrentUser: (user) => set({ currentUser: user }),
  setAllUsers: (users) => set({ allUsers: users }),
  addUser: (user) => set((state) => ({ allUsers: [...state.allUsers, user] })),
  updateUser: (id, updatedUser) =>
    set((state) => ({
      allUsers: state.allUsers.map((u) => (u.id === id ? updatedUser : u)),
      currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
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
  setUserInitialized: (initialized) => set({ isUserInitialized: initialized }), // ✅ thêm
  clearUserStore: () =>
    set({
      currentUser: null,
      allUsers: [],
      isLoading: false,
      error: null,
      isInitialized: false,
      isUserInitialized: false, // ✅ reset
    }),
}));
