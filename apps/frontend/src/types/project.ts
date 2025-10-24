// ------------------ USER CACHE ------------------
export interface UserCache {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: "USER" | "ADMIN" | string;
  updatedAt: string;
}

// ------------------ PROJECT MEMBER ------------------
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | string;
  joinedAt: string;
  user?: UserCache; // có thể không luôn có user cache đi kèm
}

// ------------------ CARD ------------------
export interface Card {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: string; // ACTIVE | ...
  deadline?: string | null;
  priority?: number | null;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  columnId?: string | null; // cho quản lý thứ tự/move
  views?: CardView[];
  labels?: CardLabel[];
}

// ------------------ COLUMN ------------------
export interface Column {
  id: string;
  projectId: string;
  title: string;
  position: number;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------ CARD VIEW ------------------
export interface CardView {
  id: string;
  cardId: string;
  projectId: string;
  componentType: string;
  columnId?: string | null;
  position: number;
  version: number;
  isPinned?: boolean;
  customTitle?: string | null;
  metadata?: Record<string, any> | null;
  updatedAt: string;
}

// ------------------ CARD LABEL ------------------
export interface CardLabel {
  id: string;
  cardId: string;
  label: string;
}

// ------------------ BOARD ------------------
export interface Board {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------ PROJECT ------------------
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  folderPath?: string | null;
  visibility: "PRIVATE" | "PUBLIC" | string;
  color?: string | null;
  background?: string | null;

  // File info
  publicId?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  resourceType?: string | null;
  originalFilename?: string | null;
  uploadedById?: string | null;

  createdAt: string;
  updatedAt: string;

  owner?: UserCache;
  members: ProjectMember[];
  cards?: Card[];
  columns?: Column[];
  boards?: Board[];
}

// ------------------ MEMBER (client-side mapping tiện dụng) ------------------
export interface Member {
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | string;
  name?: string | null;
  avatar?: string | null;
}
