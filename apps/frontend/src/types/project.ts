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

// ------------------ PROJECT MEMBER ------------------
export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: "OWNER" | "ADMIN" | "MEMBER"
  joinedAt: string
  user?: UserCache | null
}

// ------------------ CARD ------------------
export interface Card {
  id: string
  projectId: string
  columnId: string // card phải thuộc 1 column để kéo thả
  title: string
  description?: string | null
  status: "ACTIVE" | "ARCHIVED" | "DELETED"
  deadline?: string | null
  priority?: number | null
  createdById?: string | null
  updatedById?: string | null
  position?: number // thứ tự card trong column
  createdAt: string
  updatedAt: string
  views?: CardView[]
  labels?: CardLabel[]
}

// ------------------ COLUMN ------------------
export interface Column {
  id: string
  projectId: string
  boardId?: string | null
  title: string
  position: number // thứ tự cột trong board
  cardIds: string[] // thứ tự các card
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
  cards?: Card[] // optional mapping
  views?: CardView[]
}

// ------------------ CARD VIEW ------------------
export interface CardView {
  id: string
  cardId: string
  projectId: string
  componentType: "board" | "inbox" | "calendar"
  columnId?: string | null
  position: number
  version: number
  isPinned?: boolean
  customTitle?: string | null
  metadata?: Record<string, any> | null
  updatedAt: string
}

// ------------------ CARD LABEL ------------------
export interface CardLabel {
  id: string
  cardId: string
  label: string
}

// ------------------ BOARD ------------------
export interface Board {
  id: string
  projectId: string
  title: string
  type: "board" | "inbox" | "calendar" | "kanban" | "timeline"
  position: number
  columnIds: string[] // thứ tự cột
  metadata?: Record<string, any> | null
  columns?: Column[] // optional mapping
  createdAt: string
  updatedAt: string
}

// ------------------ PROJECT ------------------
export interface Project {
  id: string
  name: string
  description?: string | null
  ownerId: string
  folderPath?: string | null
  visibility: "PRIVATE" | "PUBLIC"
  color?: string | null
  background?: string | null

  publicId?: string | null
  fileUrl?: string | null
  fileType?: string | null
  fileSize?: number | null
  resourceType?: string | null
  originalFilename?: string | null
  uploadedById?: string | null

  createdAt: string
  updatedAt: string

  owner?: UserCache
  members: ProjectMember[]
  cards?: Card[]
  columns?: Column[]
  boards?: Board[]
}

// ------------------ MEMBER (client-side tiện dụng) ------------------
export interface Member {
  userId: string
  role: "OWNER" | "ADMIN" | "MEMBER"
  name?: string | null
  avatar?: string | null
}

// ------------------ DragDropState ------------------
// Lưu trạng thái toàn bộ boards, columns, cards để dễ quản lý kéo thả
export interface DragDropState {
  projects: {
    [projectId: string]: {
      project: Project
      boards: {
        [boardId: string]: {
          board: Board
          columns: {
            [columnId: string]: {
              column: Column
              cards: {
                [cardId: string]: Card
              }
              cardOrder: string[]
            }
          }
          columnOrder: string[]
        }
      }
      boardOrder: string[]
    }
  }
}
