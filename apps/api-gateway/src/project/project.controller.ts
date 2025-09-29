import { Controller, Post, Body, Param, UseGuards, Delete, Patch, Get } from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Body() body: { name: string; description?: string }) {
    return this.projectService.createProject(body);
  }

  @Patch(':id')
  async update(
    @Param('id') projectId: string,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.projectService.updateProject({ projectId, ...body });
  }

  @Delete(':id')
  async remove(@Param('id') projectId: string) {
    return this.projectService.deleteProject({ projectId });
  }

  @Post(':id/members')
  async addMember(
    @Param('id') projectId: string,
    @Body() body: { userId: string; role?: string },
  ) {
    return this.projectService.addMember({ projectId, ...body });
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectService.removeMember({ projectId, userId });
  }

  @Patch(':id/members/:userId/role')
  async updateMemberRole(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Body() body: { role: string },
  ) {
    return this.projectService.updateMemberRole({ projectId, userId, role: body.role });
  }

  @Get(':id')
  async getProject(@Param('id') projectId: string) {
    return this.projectService.getProject({ projectId });
  }
}
