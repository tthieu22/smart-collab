import { create } from 'zustand';

export interface UserNotification {
  id: string;
  senderId: string;
  type: string;
  postId?: string;
  commentId?: string;
  projectId?: string;
  projectName?: string;
  isRead: boolean;
  createdAt: string;
}

const normalizeNotification = (n: any): UserNotification => ({
  id: n.id,
  senderId: n.senderId,
  type: n.type,
  postId: n.postId,
  commentId: n.commentId,
  projectId: n.projectId,
  projectName: n.projectName,
  isRead: Boolean(n.isRead ?? n.read ?? false),
  createdAt: n.createdAt,
});

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
  setNotifications: (notifications) => {
    const normalized = notifications.map(normalizeNotification);
    set({
      notifications: normalized,
      unreadCount: normalized.filter(n => !n.isRead).length
    });
  },
  addNotification: (n) => set((state) => {
    const normalized = normalizeNotification(n);
    // Avoid duplicates
    if (state.notifications.some(existing => existing.id === normalized.id)) return state;
    return { 
      notifications: [normalized, ...state.notifications],
      unreadCount: normalized.isRead ? state.unreadCount : state.unreadCount + 1
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
