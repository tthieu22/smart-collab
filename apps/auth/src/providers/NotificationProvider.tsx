'use client';

import { useNotificationStore } from '@auth/store/notification';
import Notifications from '@auth/components/ui/notifications';

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <>
      {children}
      <Notifications notifications={notifications} removeNotification={removeNotification} />
    </>
  );
};
