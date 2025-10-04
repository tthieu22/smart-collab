import { Controller, Post, Body, Param, Patch, Delete, Get, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface CorrelationBody {
  correlationId: string;
}

interface CreateProjectBody extends CorrelationBody {
  name: string;
  description?: string;
}

interface UpdateProjectBody extends CorrelationBody {
  name?: string;
  description?: string;
}

interface AddMemberBody extends CorrelationBody {
  userId: string;
  role?: string;
}

interface UpdateMemberRoleBody extends CorrelationBody {
  role: string;
}

interface GetProjectQuery extends CorrelationBody {}
interface GetAllProjectsQuery extends CorrelationBody {}

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Body() body: CreateProjectBody) {
    return this.projectService.createProject(body);
  }

  @Patch(':id')
  async update(@Param('id') projectId: string, @Body() body: UpdateProjectBody) {
    return this.projectService.updateProject({ projectId, ...body });
  }

  @Delete(':id')
  async remove(@Param('id') projectId: string, @Body() body: CorrelationBody) {
    return this.projectService.deleteProject({ projectId, correlationId: body.correlationId });
  }

  @Post(':id/members')
  async addMember(@Param('id') projectId: string, @Body() body: AddMemberBody) {
    return this.projectService.addMember({ projectId, ...body });
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Body() body: CorrelationBody,
  ) {
    return this.projectService.removeMember({ projectId, userId, correlationId: body.correlationId });
  }

  @Patch(':id/members/:userId/role')
  async updateMemberRole(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateMemberRoleBody,
  ) {
    return this.projectService.updateMemberRole({
      projectId,
      userId,
      role: body.role,
      correlationId: body.correlationId,
    });
  }

  @Get(':id')
  async getProject(@Param('id') projectId: string, @Body() body: GetProjectQuery) {
    return this.projectService.getProject({ projectId, correlationId: body.correlationId });
  }

  @Get()
  async getAllProjects(@Body() body: GetAllProjectsQuery) {
    return this.projectService.getAllProjects({ correlationId: body.correlationId });
  }
}
