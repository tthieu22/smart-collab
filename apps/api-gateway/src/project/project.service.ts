import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

interface CorrelationDTO {
  correlationId: string;
}

interface CreateProjectDTO extends CorrelationDTO {
  name: string;
  description?: string;
  folderPath?: string;
  color?: string; // thêm color
  ownerId: string; 
}

interface UpdateProjectDTO extends CorrelationDTO {
  projectId: string;
  name?: string;
  description?: string;
  folderPath?: string;
  color?: string; // thêm color
  publicId?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  resourceType?: string;
  originalFilename?: string;
  uploadedById?: string;
}

interface MemberDTO extends CorrelationDTO {
  projectId: string;
  userId: string;
  role?: string;
}

interface MemberRoleDTO extends CorrelationDTO {
  projectId: string;
  userId: string;
  role: string;
}

@Injectable()
export class ProjectService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  private publish(correlationId: string, routingKey: string, payload: any) {
    return this.amqpConnection.publish('smart-collab', routingKey, { correlationId, ...payload });
  }

  async createProject(dto: CreateProjectDTO) {
    await this.publish(dto.correlationId, 'project.create', dto);
    console.log(dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Project creation requested', dto };
  }

  async updateProject(dto: UpdateProjectDTO) {
    await this.publish(dto.correlationId, 'project.update', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Project update requested', dto };
  }

  async deleteProject(dto: { projectId: string } & CorrelationDTO) {
    await this.publish(dto.correlationId, 'project.delete', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Project deletion requested', dto };
  }

  async addMember(dto: MemberDTO) {
    await this.publish(dto.correlationId, 'project.member.add', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Add member requested', dto };
  }

  async removeMember(dto: MemberDTO) {
    await this.publish(dto.correlationId, 'project.member.remove', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Remove member requested', dto };
  }

  async updateMemberRole(dto: MemberRoleDTO) {
    await this.publish(dto.correlationId, 'project.member.update_role', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Update member role requested', dto };
  }

  async getProject(dto: { projectId: string } & CorrelationDTO) {
    await this.publish(dto.correlationId, 'project.get', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Fetch project requested', dto };
  }

  async getAllProjects(dto: CorrelationDTO) {
    await this.publish(dto.correlationId, 'project.list', {});
    return { status: 'queued', correlationId: dto.correlationId, message: 'Fetch all projects requested' };
  }
}
