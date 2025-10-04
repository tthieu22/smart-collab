export interface UserCache {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  user: UserCache;
}

export interface ProjectBE {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  folderPath?: string;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  tasks?: Task[]; // nếu backend trả task
}

export interface Member {
  userId: string;
  role: string;
  name?: string;
  avatar?: string;
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
  members: Member[];
  tasks: Task[];
}
