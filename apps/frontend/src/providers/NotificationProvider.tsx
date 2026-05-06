'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@smart/store/notification';
import Notifications from '@smart/components/ui/notifications';
import { useAuthStore } from '@smart/store/auth';
import { useUserNotificationStore } from '@smart/store/user-notifications';
import { autoRequest } from '@smart/services/auto.request';

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { notifications, removeNotification } = useNotificationStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const unreadCount = useUserNotificationStore((s) => s.unreadCount);
  const setUserNotifications = useUserNotificationStore((s) => s.setNotifications);

  useEffect(() => {
    const baseTitle = 'Smart Collab';
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [unreadCount]);

  useEffect(() => {
    if (!accessToken) return;
    let mounted = true;
    const loadNotifications = async () => {
      try {
        const data = await autoRequest<any[]>('/home/notifications', { method: 'GET' });
        if (mounted) setUserNotifications(data || []);
      } catch {
        // Keep app usable even if notification history endpoint is temporarily unavailable.
      }
    };
    loadNotifications();
    return () => {
      mounted = false;
    };
  }, [accessToken, setUserNotifications]);

  return (
    <>
      {children}
      <Notifications
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </>
  );
};
