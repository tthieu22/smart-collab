import { autoRequest } from './auto.request';

type UploadAction = "upload" | "update" | "delete" | "delete_all";

interface UploadRequest {
  action: UploadAction;
  projectFolder?: string;
  files?: string[];
  public_ids?: string[];
}

interface UploadResultItem {
  public_id: string;
  url: string;
  type: string;
  size: number;
  original_filename: string;
  resource_type: string;
}

interface UploadResponse {
  success: boolean;
  data: UploadResultItem[] | any;
}

export class UploadService {
  // Gọi API upload với autoRequest
  private handleUpload(body: UploadRequest) {
    return autoRequest<UploadResponse>("/upload", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // Các helper cụ thể
  uploadFiles(projectFolder: string, files: string[]) {
    return this.handleUpload({ action: "upload", projectFolder, files });
  }

  updateFiles(projectFolder: string, files: string[], public_ids: string[]) {
    return this.handleUpload({ action: "update", projectFolder, files, public_ids });
  }

  deleteFiles(public_ids: string[]) {
    return this.handleUpload({ action: "delete", public_ids });
  }

  deleteAllFiles(projectFolder: string) {
    return this.handleUpload({ action: "delete_all", projectFolder });
  }
}

export const uploadService = new UploadService();
