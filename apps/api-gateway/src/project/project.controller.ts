import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface CorrelationBody {
  correlationId: string;
}

interface CreateProjectBody extends CorrelationBody {
  name: string;
  description?: string;
  folderPath?: string;
  color?: string; // thêm color
}

interface UpdateProjectBody extends CorrelationBody {
  name?: string;
  description?: string;
  folderPath?: string;
  publicId?: string;
  fileUrl?: string;
  fileType?: string;
  color?: string; // thêm color
  fileSize?: number;
  resourceType?: string;
  originalFilename?: string;
  uploadedById?: string;
}

interface AddMemberBody extends CorrelationBody {
  userId: string;
  role?: string;
}

interface UpdateMemberRoleBody extends CorrelationBody {
  role: string;
}

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Body() body: CreateProjectBody, @Req() req: any) {
    const user = req.user;
    console.log("user",user)
    return this.projectService.createProject({
      ...body,
      ownerId: user.userId,
    });
  }

  @Post('update')
  async update(@Body() body: UpdateProjectBody & { projectId: string }) {
    return this.projectService.updateProject(body);
  }

  @Post('delete')
  async remove(@Body() body: { projectId: string; correlationId: string }) {
    return this.projectService.deleteProject(body);
  }

  @Post('add-member')
  async addMember(@Body() body: { projectId: string } & AddMemberBody) {
    return this.projectService.addMember(body);
  }

  @Post('remove-member')
  async removeMember(@Body() body: { projectId: string; userId: string; correlationId: string }) {
    return this.projectService.removeMember(body);
  }

  @Post('update-member-role')
  async updateMemberRole(@Body() body: { projectId: string; userId: string } & UpdateMemberRoleBody) {
    return this.projectService.updateMemberRole(body);
  }

  /** Lấy thông tin project theo body */
  @Post('get')
  async getProject(@Body() body: { projectId: string; correlationId: string }) {
    return this.projectService.getProject(body);
  }

  /** Lấy tất cả project theo body */
  @Post('get-all')
  async getAllProjects(@Body() body: { correlationId: string }) {
    return this.projectService.getAllProjects(body);
  }
}
