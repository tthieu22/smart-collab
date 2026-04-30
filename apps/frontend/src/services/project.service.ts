import { autoRequest } from './auto.request';
import { API_ENDPOINTS } from '@smart/lib/constants';
import { Project } from '@smart/types/project';

type ProjectResponse = { status: string; message: string; dto?: any, card:any};
type GetAllProjectsResponse = {
  items: Project[];
  total: number;
  page: number;
  limit: number;
};

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

  getAllProjects(pageOrOptions: number | any = 1, limit: number = 10) {
    let page = 1;
    let actualLimit = limit;
    let otherOptions = {};

    if (typeof pageOrOptions === 'object') {
      page = pageOrOptions.page || 1;
      actualLimit = pageOrOptions.limit || 10;
      otherOptions = pageOrOptions;
    } else {
      page = pageOrOptions;
    }

    return autoRequest<GetAllProjectsResponse>(API_ENDPOINTS.PROJECT.FIND_ALL, {
      method: 'POST',
      body: JSON.stringify({ page, limit: actualLimit, ...otherOptions }),
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

  getColumnsByProject(projectId: string) {
    return autoRequest<ProjectResponse>(
      `${API_ENDPOINTS.PROJECT.COLUMN.GET_BY_PROJECT}/${projectId}`,
      {
        method: 'GET',
      }
    );
  }

  getColumnsByBoard(boardId: string) {
    return autoRequest<ProjectResponse>(
      `${API_ENDPOINTS.PROJECT.COLUMN.GET_BY_BOARD}/${boardId}`,
      {
        method: 'GET',
      }
    );
  }

  updateColumn(data: { columnId: string; title?: string; position?: number }) {
    return autoRequest<any>(API_ENDPOINTS.PROJECT.COLUMN.UPDATE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteColumn(columnId: string) {
    return autoRequest<any>(API_ENDPOINTS.PROJECT.COLUMN.DELETE, {
      method: 'DELETE',
      body: JSON.stringify({ columnId }),
    });
  }

  aiBuildProject(prompt: string) {
    return autoRequest<any>(API_ENDPOINTS.PROJECT.AI_BUILD, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  aiGenerateCard(cardId: string, type: 'title' | 'description' | 'comment') {
    const endpoint = API_ENDPOINTS.PROJECT.CARD_AI_GENERATE.replace(':cardId', cardId);
    return autoRequest<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  analyzeBoard(boardId: string) {
    return autoRequest<any>(`/projects/${boardId}/ai-analyze-board`, {
      method: 'POST',
    });
  }

  askBoard(boardId: string, query: string) {
    return autoRequest<any>(`/projects/${boardId}/ai-ask-board`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  aiGenerateSubtasks(cardId: string) {
    return autoRequest<any>(`/projects/cards/${cardId}/ai-subtasks`, {
      method: 'POST'
    });
  }

  aiPredictTimeline(cardId: string) {
    return autoRequest<any>(`/projects/cards/${cardId}/ai-timeline`, {
      method: 'POST'
    });
  }
}

export const projectService = new ProjectService();
