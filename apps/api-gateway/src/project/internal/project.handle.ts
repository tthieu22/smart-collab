import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectService } from './project.service';
import { ProjectMessage } from './dto/project.dto';

@Controller()
export class ProjectHandler {
  private readonly logger = new Logger(ProjectHandler.name);

  constructor(private readonly projectService: ProjectService) {}

  @MessagePattern({ cmd: 'health.ping' })
  async handlePing() {
    return { success: true, message: 'Project Service is UP' };
  }

  @MessagePattern({ cmd: 'project.create' })
  async handleCreateProject(@Payload() payload: ProjectMessage) {
    this.logger.log(`[project.create] Received payload: ${JSON.stringify(payload)}`);
    try {
      const result = await this.projectService.createProject(payload);
      return { success: true, data: result };
    } catch (error: any) {
      this.logger.error(`Error handling project.create: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.update' })
  async handleUpdateProject(@Payload() payload: ProjectMessage) {
    this.logger.log(`[project.update] Received payload: ${JSON.stringify(payload)}`);
    try {
      const updated = await this.projectService.updateProject(payload);
      return { success: true, data: updated };
    } catch (error: any) {
      this.logger.error(`Error handling project.update: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.delete' })
  async handleDeleteProject(@Payload() payload: any) {
    this.logger.log(`[project.delete] Received payload: ${JSON.stringify(payload)}`);
    try {
      const projectId = payload?.projectId || payload?.id || payload;
      const userId = payload?.userId;
      const deleted = await this.projectService.deleteProject(projectId, userId);
      return { success: true, data: deleted };
    } catch (error: any) {
      this.logger.error(`Error handling project.delete: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.get' })
  async handleGetProject(@Payload() payload: any) {
    this.logger.log(`[project.get] Received payload: ${JSON.stringify(payload)}`);
    try {
      const projectId = payload?.projectId || payload?.id || payload;
      const userId = payload?.userId;
      const project = await this.projectService.getProjectStructure(projectId, userId);
      return { success: true, data: project };
    } catch (error: any) {
      this.logger.error(`Error handling project.get: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.get_all' })
  async handleGetAllProjects(@Payload() payload: any) {
    this.logger.log(`[project.get_all] Received payload: ${JSON.stringify(payload)}`);
    try {
      const userId = payload?.userId;
      const page = payload?.page ?? 1;
      const limit = payload?.limit ?? 20;
      const search = payload?.search;
      const projects = await this.projectService.getAllProjects(userId, page, limit, search);
      return { success: true, data: projects };
    } catch (error: any) {
      this.logger.error(`Error handling project.get_all: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.add_member' })
  async handleAddMember(@Payload() payload: { projectId: string; userId: string; role?: string; addedBy?: string; userName?: string; userAvatar?: string; userEmail?: string }) {
    this.logger.log(`[project.add_member] Received payload: ${JSON.stringify(payload)}`);
    try {
      const result = await this.projectService.addMember(
        payload.projectId, 
        payload.userId, 
        payload.role,
        payload.userName,
        payload.userAvatar,
        payload.addedBy,
        payload.userEmail
      );
      return result;
    } catch (error: any) {
      this.logger.error(`Error handling project.add_member: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.remove_member' })
  async handleRemoveMember(@Payload() payload: { projectId: string; userId: string }) {
    this.logger.log(`[project.remove_member] Received payload: ${JSON.stringify(payload)}`);
    try {
      const result = await this.projectService.removeMember(payload.projectId, payload.userId, (payload as any).removedBy || (payload as any).userId);
      return result;
    } catch (error: any) {
      this.logger.error(`Error handling project.remove_member: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.member.respond_invite' })
  async handleRespondInvite(@Payload() payload: { projectId: string; userId: string; accept: boolean }) {
    this.logger.log(`[project.member.respond_invite] Received payload: ${JSON.stringify(payload)}`);
    try {
      const result = await this.projectService.respondInvite(payload.projectId, payload.userId, payload.accept);
      return result;
    } catch (error: any) {
      this.logger.error(`Error handling project.member.respond_invite: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.analytics' })
  async handleGetAnalytics(@Payload() payload: { userId: string; projectId?: string }) {
    this.logger.log(`[project.analytics] Received payload: ${JSON.stringify(payload)}`);
    try {
      const result = await this.projectService.getAnalytics(payload.userId, payload.projectId);
      return { success: true, data: result };
    } catch (error: any) {
      this.logger.error(`Error handling project.analytics: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.get_top_collaborators' })
  async handleGetTopCollaborators() {
    try {
      const userIds = await this.projectService.getTopCollaborators();
      return { success: true, data: userIds };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.recycle-bin.get_all' })
  async handleGetRecycleBin(@Payload() payload: { projectId: string }) {
    try {
      const items = await this.projectService.getRecycleBin(payload.projectId);
      return { success: true, data: items };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.restore' })
  async handleRestoreProject(@Payload() payload: { projectId: string; userId?: string }) {
    try {
      const result = await this.projectService.restoreProject(payload.projectId, payload.userId);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  @MessagePattern({ cmd: 'project.search' })
  async handleSearch(@Payload() payload: { userId: string; query: string }) {
    try {
      const result = await this.projectService.search(payload.userId, payload.query);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
