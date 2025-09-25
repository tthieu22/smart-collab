// libs/events/notification.events.ts
export interface NotificationCreatedEvent {
  id: string;
  userId: string;
  type: string;   // TASK | PROJECT | SYSTEM
  title: string;
  message: string;
  createdAt: string;
}
