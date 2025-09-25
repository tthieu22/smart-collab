// libs/events/user.events.ts
export interface UserCreatedEvent {
  id: string;         // Mongo ObjectId dạng string
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;       // USER | ADMIN
  createdAt: string;  // ISO date
}

export interface UserUpdatedEvent extends UserCreatedEvent {
  updatedAt: string;
}
