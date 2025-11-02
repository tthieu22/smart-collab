import { autoRequest } from './auto.request';
import { API_ENDPOINTS } from '@smart/lib/constants';
import { Project } from '@smart/types/project';

type CreateProjectRequest = {
  name: string;
  description?: string;
  folderPath?: string;
  color?: string;
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
  color?: string;
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
  // ------------------- Project CRUD -------------------
  createProject(request: CreateProjectRequest) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.CREATE, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  updateProject(request: UpdateProjectRequest) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.UPDATE, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  deleteProject(request: DeleteProjectRequest) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.DELETE, {
      method: 'DELETE',
      body: JSON.stringify(request),
    });
  }

  // ------------------- Project Members -------------------
  addMember(request: AddMemberRequest) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.ADD_MEMBER, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  removeMember(request: RemoveMemberRequest) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.REMOVE_MEMBER, {
      method: 'DELETE',
      body: JSON.stringify(request),
    });
  }

  updateMemberRole(request: UpdateMemberRoleRequest) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.UPDATE_MEMBER_ROLE, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  // ------------------- GET Project(s) -------------------
  getProject(request: GetProjectRequest) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.GET, {
      method: 'POST', // POST để truyền body
      body: JSON.stringify(request),
    });
  }

  getAllProjects(request: GetAllProjectsRequest) {
    return autoRequest<GetAllProjectsResponse>(API_ENDPOINTS.PROJECT.FIND_ALL, {
      method: 'POST', // POST để truyền correlationId
      body: JSON.stringify(request),
    });
  }

  getCard(id: string) {
    return autoRequest<ProjectResponse>(`${API_ENDPOINTS.PROJECT.COLUMN.CARD.GET}/${id}`, {
      method: 'GET',
    });
  }
  getCardByColumn(columnId: string) {
    return autoRequest<ProjectResponse>(`${API_ENDPOINTS.PROJECT.COLUMN.GET}/${columnId}`, {
      method: 'GET',
    });
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
