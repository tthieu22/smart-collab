import { autoRequest } from './auto.request';
import { API_ENDPOINTS } from '@smart/lib/constants';
import { Project } from '@smart/types/project';

type ProjectResponse = { status: string; message: string; dto?: any, card:any};
type GetAllProjectsResponse = Project[];

class ProjectService {
  // ------------------- Project CRUD -------------------
  createProject(data: any) {
    return autoRequest<any>(API_ENDPOINTS.PROJECT.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateProject(data: any) {
    return autoRequest<any>(API_ENDPOINTS.PROJECT.UPDATE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteProject(data: any) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.DELETE, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // ------------------- Project Members -------------------
  addMember(data: any) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.ADD_MEMBER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  removeMember(data: any) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.REMOVE_MEMBER, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  updateMemberRole(data: any) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.UPDATE_MEMBER_ROLE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ------------------- GET Project(s) -------------------
  getProject(data: any) {
    return autoRequest<ProjectResponse>(API_ENDPOINTS.PROJECT.GET, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getAllProjects() {
    // Nếu backend không cần dữ liệu truyền vào, ta có thể gửi body rỗng hoặc null
    return autoRequest<GetAllProjectsResponse>(API_ENDPOINTS.PROJECT.FIND_ALL, {
      method: 'POST',
      body: JSON.stringify({}),
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
