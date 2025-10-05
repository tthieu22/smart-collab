import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Project, Member } from './dto/project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  /** CREATE PROJECT */
  @Post()
  async create(@Body() body: Project, @Req() req: any) {
    const user = req.user;
    return this.projectService.createProject({
      ...body,
      ownerId: user.userId,
    });
  }

  /** UPDATE PROJECT */
  @Patch('update')
  async update(@Body() body: Project) {
    return this.projectService.updateProject(body);
  }

  /** DELETE PROJECT */
  @Post('delete')
  async remove(@Body() body: Project) {
    return this.projectService.deleteProject(body);
  }

  /** ADD MEMBER */
  @Post('add-member')
  async addMember(@Body() body: Member) {
    return this.projectService.addMember(body);
  }

  /** REMOVE MEMBER */
  @Post('remove-member')
  async removeMember(@Body() body: Member) {
    return this.projectService.removeMember(body);
  }

  /** UPDATE MEMBER ROLE */
  @Post('update-member-role')
  async updateMemberRole(@Body() body: Member) {
    return this.projectService.updateMemberRole(body);
  }

  /** GET PROJECT */
  @Post('get')
  async getProject(@Body() body: Project) {
    return this.projectService.getProject(body);
  }

  /** GET ALL PROJECTS */
  @Post('get-all')
  async getAllProjects(@Body() body: { correlationId: string }) {
    return this.projectService.getAllProjects(body);
  }
}
