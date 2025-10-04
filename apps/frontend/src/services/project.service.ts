import { APP_CONFIG, API_ENDPOINTS } from "@smart/lib/constants";
import { Project } from "@smart/types/project";

type CreateProjectRequest = {
  name: string;
  description?: string;
  folderPath?: string;
  color?: string; // thêm color
  correlationId: string;
};

type UpdateProjectRequest = {
  projectId: string;
  name?: string;
  description?: string;
  folderPath?: string;
  publicId?: string;
  files?: any;
  fileUrl?: string;
  fileType?: string;
  color?: string; // thêm color
  fileSize?: number;
  resourceType?: string;
  originalFilename?: string;
  uploadedById?: string;
  correlationId: string;
};

type DeleteProjectRequest = { projectId: string; correlationId: string };
type AddMemberRequest = { projectId: string; userId: string; role?: string; correlationId: string };
type RemoveMemberRequest = { projectId: string; userId: string; correlationId: string };
type UpdateMemberRoleRequest = { projectId: string; userId: string; role: string; correlationId: string };
type GetProjectRequest = { projectId: string; correlationId: string };
type GetAllProjectsRequest = { correlationId: string };

type ProjectResponse = { status: string; correlationId: string; message: string; dto?: any };
type GetAllProjectsResponse = Project[];

class ProjectService {
  private async request<T>(endpoint: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
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
      return await response.json() as T;
    } catch (error) {
      throw error;
    }
  }

  // ------------------- Project CRUD -------------------
  async createProject(request: CreateProjectRequest, accessToken?: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>(API_ENDPOINTS.PROJECT.CREATE, {
      method: "POST",
      body: JSON.stringify(request),
    }, accessToken);
  }

  async updateProject(request: UpdateProjectRequest, accessToken?: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>(API_ENDPOINTS.PROJECT.UPDATE, {
      method: "PATCH",
      body: JSON.stringify(request),
    }, accessToken);
  }

  async deleteProject(request: DeleteProjectRequest, accessToken?: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>(API_ENDPOINTS.PROJECT.DELETE, {
      method: "DELETE",
      body: JSON.stringify(request),
    }, accessToken);
  }

  // ------------------- Project Members -------------------
  async addMember(request: AddMemberRequest, accessToken?: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>(API_ENDPOINTS.PROJECT.ADD_MEMBER, {
      method: "POST",
      body: JSON.stringify(request),
    }, accessToken);
  }

  async removeMember(request: RemoveMemberRequest, accessToken?: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>(API_ENDPOINTS.PROJECT.REMOVE_MEMBER, {
      method: "DELETE",
      body: JSON.stringify(request),
    }, accessToken);
  }

  async updateMemberRole(request: UpdateMemberRoleRequest, accessToken?: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>(API_ENDPOINTS.PROJECT.UPDATE_MEMBER_ROLE, {
      method: "PATCH",
      body: JSON.stringify(request),
    }, accessToken);
  }

  // ------------------- GET Project(s) -------------------
  async getProject(request: GetProjectRequest, accessToken?: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>(API_ENDPOINTS.PROJECT.GET, {
      method: "POST", // dùng POST để truyền body thay vì GET
      body: JSON.stringify(request),
    }, accessToken);
  }

  async getAllProjects(request: GetAllProjectsRequest, accessToken?: string): Promise<GetAllProjectsResponse> {
    return this.request<GetAllProjectsResponse>(API_ENDPOINTS.PROJECT.FIND_ALL, {
      method: "POST", // dùng POST để truyền correlationId trong body
      body: JSON.stringify(request),
    }, accessToken);
  }
}

export const projectService = new ProjectService();
export type {
  CreateProjectRequest,
  UpdateProjectRequest,
  DeleteProjectRequest,
  AddMemberRequest,
  RemoveMemberRequest,
  UpdateMemberRoleRequest,
  GetProjectRequest,
  GetAllProjectsRequest,
  ProjectResponse,
  GetAllProjectsResponse,
};
