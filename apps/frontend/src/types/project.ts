export interface UserCache {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: "USER" | "ADMIN" | string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  user: UserCache;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  assigneeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  folderPath?: string;
  createdAt: string;
  updatedAt: string;
  color?: string | null;
  publicId?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  resourceType?: string | null;
  originalFilename?: string | null;
  uploadedById?: string | null;
  owner: UserCache;
  members: ProjectMember[];
  tasks?: Task[];
}

export interface Member {
  userId: string;
  role: string;
  name?: string;
  avatar?: string;
}
