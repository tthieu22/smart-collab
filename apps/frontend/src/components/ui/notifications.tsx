import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Alert } from 'antd';

interface NotificationItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  autoClose?: boolean;
}

interface NotificationsProps {
  notifications: NotificationItem[];
  removeNotification: (id: number) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, removeNotification }) => {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, width: 300 }}>
      {notifications.map((n) => (
        <Alert
          key={n.id}
          message={n.message}
          type={n.type}
          showIcon
          action={
            <CloseOutlined style={{ cursor: 'pointer' }} onClick={() => removeNotification(n.id)} />
          }
          style={{ marginBottom: 10 }}
        />
      ))}
    </div>
  );
};

export default Notifications;
