import { create } from 'zustand';
import { User } from '../types/auth';

interface UserState {
  // State
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // Track if we've loaded user data

  // Actions
  setCurrentUser: (user: User | null) => void;
  setAllUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, user: User) => void;
  removeUser: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setInitialized: (initialized: boolean) => void;
  clearUserStore: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  currentUser: null,
  allUsers: [],
  isLoading: false,
  error: null,
  isInitialized: false,

  // Actions
  setCurrentUser: (user: User | null) => {
    set({ currentUser: user });
  },

  setAllUsers: (users: User[]) => {
    set({ allUsers: users });
  },

  addUser: (user: User) => {
    set(state => ({
      allUsers: [...state.allUsers, user],
    }));
  },

  updateUser: (id: string, updatedUser: User) => {
    set(state => ({
      allUsers: state.allUsers.map(user =>
        user.id === id ? updatedUser : user
      ),
      currentUser:
        state.currentUser?.id === id ? updatedUser : state.currentUser,
    }));
  },

  removeUser: (id: string) => {
    set(state => ({
      allUsers: state.allUsers.filter(user => user.id !== id),
      currentUser: state.currentUser?.id === id ? null : state.currentUser,
    }));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  setInitialized: (initialized: boolean) => {
    set({ isInitialized: initialized });
  },

  clearUserStore: () => {
    set({
      currentUser: null,
      allUsers: [],
      isLoading: false,
      error: null,
      isInitialized: false,
    });
  },
}));
