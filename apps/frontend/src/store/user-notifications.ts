import { create } from 'zustand';

export interface UserNotification {
  id: string;
  senderId: string;
  type: string;
  postId?: string;
  commentId?: string;
  isRead: boolean;
  createdAt: string;
}

interface UserNotificationState {
  notifications: UserNotification[];
  unreadCount: number;
  setNotifications: (notifications: UserNotification[]) => void;
  addNotification: (notification: UserNotification) => void;
  markAsRead: (id: string) => void;
}

export const useUserNotificationStore = create<UserNotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ 
    notifications, 
    unreadCount: notifications.filter(n => !n.isRead).length 
  }),
  addNotification: (n) => set((state) => {
    // Avoid duplicates
    if (state.notifications.some(existing => existing.id === n.id)) return state;
    return { 
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1
    };
  }),
  markAsRead: (id) => set((state) => {
    const notification = state.notifications.find(n => n.id === id);
    if (!notification || notification.isRead) return state;
    return {
      notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1)
    };
  })
}));
