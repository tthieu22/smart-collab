import { autoRequest } from './auto.request';

type UploadAction = "upload" | "update" | "delete" | "delete_all";

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
  // Gửi FormData với file trực tiếp
  private handleUploadFormData(body: {
    action: UploadAction;
    projectFolder?: string;
    files?: File[];
    public_ids?: string[];
  }) {
    const formData = new FormData();
    formData.append("action", body.action);

    if (body.projectFolder) formData.append("projectFolder", body.projectFolder);
    if (body.public_ids) body.public_ids.forEach(id => formData.append("public_ids[]", id));
    if (body.files) body.files.forEach(file => formData.append("files", file));

    return autoRequest<UploadResponse>("/upload", {
      method: "POST",
      body: formData,
    });
  }

  uploadFiles(projectFolder: string, files: File[]) {
    return this.handleUploadFormData({ action: "upload", projectFolder, files });
  }

  updateFiles(projectFolder: string, files: File[], public_ids: string[]) {
    return this.handleUploadFormData({ action: "update", projectFolder, files, public_ids });
  }

  deleteFiles(public_ids: string[]) {
    return this.handleUploadFormData({ action: "delete", public_ids });
  }

  deleteAllFiles(projectFolder: string) {
    return this.handleUploadFormData({ action: "delete_all", projectFolder });
  }
}

export const uploadService = new UploadService();
