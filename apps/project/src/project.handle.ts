import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectService } from './project.service';

@Controller()
export class ProjectHandler {
  private readonly logger = new Logger(ProjectHandler.name);

  constructor(private readonly projectService: ProjectService) {}

  @MessagePattern({ cmd: 'project.get' })
  async handleGetProject(@Payload() payload: any) {
    try {
      const projectId: string = payload?.projectId || payload?.id || payload;
      const project = await this.projectService.getProjectStructure(projectId);
      return { success: true, data: project };
    } catch (error: any) {
      this.logger.error(
        `Error handling project.get: ${error.message}`,
        error.stack,
      );
      return { success: false, message: error.message || 'Project not found' };
    }
  }

  @MessagePattern({ cmd: 'project.get_all' })
  async handleGetAllProjects() {
    try {
      const projects = await this.projectService.getAllProjects();
      return { success: true, data: projects };
    } catch (error: any) {
      this.logger.error(
        `Error handling project.get_all: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: error.message || 'Unable to fetch projects',
      };
    }
  }
}
