'use client';

import { useNotificationStore } from '@mood/store/notification';
import Notifications from '@mood/components/ui/notifications';

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <>
      {children}
      <Notifications notifications={notifications} removeNotification={removeNotification} />
    </>
  );
};
