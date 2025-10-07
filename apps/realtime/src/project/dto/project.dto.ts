export interface ProjectMessage {
  correlationId: string;
  projectId?: string;
  projects?: any[];
  project?: any;
  userId?: string;
  role?: string;
  member?: any;
  [key: string]: any;
}
