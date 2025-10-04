import { APP_CONFIG } from "@smart/lib/constants";

type UploadAction = "upload" | "update" | "delete" | "delete_all";

interface UploadRequest {
  action: UploadAction;
  projectFolder?: string; // folder project
  files?: string[];        // base64 strings
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
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    const url = `${APP_CONFIG.API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
      credentials: "include",
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized");
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      throw error;
    }
  }

  async handleUpload(body: UploadRequest, accessToken?: string): Promise<UploadResponse> {
    return this.request<UploadResponse>("/upload", {
      method: "POST",
      body: JSON.stringify(body),
    }, accessToken);
  }

  // Optional helpers
  async uploadFiles(projectFolder: string, files: string[], accessToken?: string) {
    return this.handleUpload({ action: "upload", projectFolder, files }, accessToken);
  }

  async updateFiles(projectFolder: string, files: string[], public_ids: string[], accessToken?: string) {
    return this.handleUpload({ action: "update", projectFolder, files, public_ids }, accessToken);
  }

  async deleteFiles(public_ids: string[], accessToken?: string) {
    return this.handleUpload({ action: "delete", public_ids }, accessToken);
  }

  async deleteAllFiles(projectFolder: string, accessToken?: string) {
    return this.handleUpload({ action: "delete_all", projectFolder }, accessToken);
  }
}

export const uploadService = new UploadService();
