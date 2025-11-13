import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectService } from './project.service';
import { ProjectMessage } from './dto/project.dto';

@Controller()
export class ProjectHandler {
  private readonly logger = new Logger(ProjectHandler.name);

  constructor(private readonly projectService: ProjectService) {}

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
      const deleted = await this.projectService.deleteProject(projectId);
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
      const projects = await this.projectService.getAllProjects(userId);
      return { success: true, data: projects };
    } catch (error: any) {
      this.logger.error(`Error handling project.get_all: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }
}
