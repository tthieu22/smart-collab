import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  autoClose?: boolean;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (
    message: string,
    type?: NotificationType,
    autoClose?: boolean,
    duration?: number
  ) => void;
  removeNotification: (id: number) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (
    message,
    type = 'info',
    autoClose = true,
    duration = 3000
  ) => {
    const id = Date.now();
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id, message, type, autoClose, duration },
      ],
    }));

    if (autoClose) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
