// project.interface.ts

export interface Correlation {
  correlationId: string;
}

// ---------------- Project ----------------
export interface Project extends Correlation {
  projectId: string;       // dùng cho update, delete, get
  name?: string;
  visibility: string;
  description?: string;
  folderPath?: string;
  color?: string;
  publicId?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  resourceType?: string;
  originalFilename?: string;
  uploadedById?: string;
  ownerId?: string;        // dùng khi tạo
}

// ---------------- Member ----------------
export interface Member extends Correlation {
  projectId: string;
  userId: string;
  role?: string;
}
