// libs/events/task.events.ts
export interface TaskCreatedEvent {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string; // TODO | IN_PROGRESS | DONE
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
}

export interface TaskUpdatedEvent extends TaskCreatedEvent {
  updatedAt: string;
}

export interface CommentAddedEvent {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}
