'use client';

import { useNotificationStore } from '@smart/store/notification';
import Notifications from '@smart/components/ui/notifications';

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { notifications, removeNotification } = useNotificationStore();

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
