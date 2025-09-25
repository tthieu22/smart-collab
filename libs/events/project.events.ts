// libs/events/project.events.ts
export interface ProjectCreatedEvent {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
}

export interface ProjectMemberAddedEvent {
  projectId: string;
  userId: string;
  role: string; // MEMBER | ADMIN
  addedAt: string;
}
