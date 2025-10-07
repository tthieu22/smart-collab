export interface Correlation {
  correlationId: string;
}

export interface ProjectMessage extends Correlation {
  projectId?: string;
  name?: string;
  description?: string;
  ownerId?: string;
  visibility:string,
  userId?: string;
  role?: string;
  folderPath?: string;
  color?: string;
  [key: string]: any;
}