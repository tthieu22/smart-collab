// ------------------ USER CACHE ------------------
export interface UserCache {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
  role: "USER" | "ADMIN"
  updatedAt: string
}

export interface MoveCopyCardPayload {
  cardId: string;
  srcBoardId?: string;
  destBoardId?: string;
  srcColumnId?: string;
  destColumnId?: string;
  destIndex?: number;
  userId?: string,
}

// ------------------ PROJECT MEMBER ------------------
export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: "OWNER" | "ADMIN" | "MEMBER"
  joinedAt: string
  user?: UserCache | null
}
// types/project.ts

// ------------------ CARD ------------------
export interface Card {
  id: string;
  projectId: string;
  columnId?: string | null; // ← nullable, không bắt buộc
  title: string;
  description?: string | null;
  status: "ACTIVE" | "ARCHIVED" | "DELETED";
  deadline?: string | null;
  priority?: number | null;
  position: number;

  // Người tạo / sửa (denormalized)
  createdById?: string | null;
  createdByName?: string | null;
  createdByAvatar?: string | null;
  updatedById?: string | null;
  updatedByName?: string | null;
  updatedByAvatar?: string | null;

  createdAt: string;
  updatedAt: string;

  // Ảnh bìa
  coverPublicId?: string | null;
  coverUrl?: string | null;
  coverFileType?: string | null;
  coverFileSize?: number | null;
  coverResourceType?: string | null;
  coverFilename?: string | null;

  // Relations
  views?: CardView[];
  labels?: CardLabel[];
  comments?: CardComment[];
  checklist?: ChecklistItem[];
  attachments?: Attachment[];
}

// ------------------ CARD COMMENT ------------------
export interface CardComment {
  id: string;
  cardId: string;
  userId: string;
  userName: string;
  avatar?: string | null;
  content: string;
  createdAt: string;
}

// ------------------ CHECKLIST ITEM ------------------
export interface ChecklistItem {
  id: string;
  cardId: string;
  title: string;
  done: boolean;
  position: number;
}

// ------------------ ATTACHMENT ------------------
export interface Attachment {
  id: string;
  cardId: string;
  name: string;
  url: string;
  size: string;
  uploadedAt: string;

  // Người upload
  uploadedById?: string | null;
  uploadedByName?: string | null;
  uploadedByAvatar?: string | null;

  // File info
  publicId?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  resourceType?: string | null;
  originalFilename?: string | null;
}

// ------------------ CARD LABEL ------------------
export interface CardLabel {
  id: string;
  cardId: string;
  label: string;
  color: string; // ← BẮT BUỘC, không optional
  name?: string | null;
}

// ------------------ CARD VIEW ------------------
export interface CardView {
  id: string;
  cardId: string;
  projectId: string;
  componentType: "board" | "inbox" | "calendar";
  columnId?: string | null;
  position: number;
  version: number;
  isPinned?: boolean | null;
  customTitle?: string | null;
  metadata?: Record<string, any> | null;
  updatedAt: string;
}

// ------------------ COLUMN ------------------
export interface Column {
  id: string;
  projectId: string;
  boardId?: string | null;
  title: string;
  position: number;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;

  // Client-side
  cardIds: string[];
  cards?: Card[];
  views?: CardView[];
}

// ------------------ BOARD ------------------
export interface Board {
  id: string;
  projectId?: string | null; // ← nullable
  title: string;
  type: "board" | "inbox" | "calendar" | "kanban" | "timeline";
  position: number;
  columnIds: string[];
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;

  columns?: Column[];
  ownerId?: string | null;
}

// ------------------ PROJECT ------------------
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  folderPath?: string | null;
  visibility: "PRIVATE" | "PUBLIC";
  color?: string | null;
  background?: string | null;

  publicId?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  resourceType?: string | null;
  originalFilename?: string | null;
  uploadedById?: string | null;

  createdAt: string;
  updatedAt: string;

  owner?: UserCache | null;
  members: ProjectMember[];
  cards?: Card[];
  columns?: Column[];
  boards?: Board[];
  labels?: CardLabel[];
  views?: CardView[];
}