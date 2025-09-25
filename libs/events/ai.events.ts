// libs/events/ai.events.ts
export interface AIRequestEvent {
  id: string;
  userId: string;
  query: string;
  createdAt: string;
}

export interface AIResponseEvent {
  requestId: string;
  result: string;
  createdAt: string;
}
