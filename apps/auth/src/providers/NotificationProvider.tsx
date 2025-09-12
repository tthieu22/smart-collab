'use client';

import { useNotificationStore } from '@/store/notification';
import Notifications from '@/components/ui/notifications';

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <>
      {children}
      <Notifications notifications={notifications} removeNotification={removeNotification} />
    </>
  );
};
