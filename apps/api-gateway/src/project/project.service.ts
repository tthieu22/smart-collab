import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ProjectService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  private publish(correlationId: string, routingKey: string, payload: any) {
    return this.amqpConnection.publish('smart-collab', routingKey, { correlationId, ...payload });
  }

  async createProject(dto: { name: string; description?: string; correlationId: string }) {
    await this.publish(dto.correlationId, 'project.create', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Project creation requested', dto };
  }

  async updateProject(dto: { projectId: string; name?: string; description?: string; correlationId: string }) {
    await this.publish(dto.correlationId, 'project.update', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Project update requested', dto };
  }

  async deleteProject(dto: { projectId: string; correlationId: string }) {
    await this.publish(dto.correlationId, 'project.delete', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Project deletion requested', dto };
  }

  async addMember(dto: { projectId: string; userId: string; role?: string; correlationId: string }) {
    await this.publish(dto.correlationId, 'project.member.add', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Add member requested', dto };
  }

  async removeMember(dto: { projectId: string; userId: string; correlationId: string }) {
    await this.publish(dto.correlationId, 'project.member.remove', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Remove member requested', dto };
  }

  async updateMemberRole(dto: { projectId: string; userId: string; role: string; correlationId: string }) {
    await this.publish(dto.correlationId, 'project.member.update_role', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Update member role requested', dto };
  }

  async getProject(dto: { projectId: string; correlationId: string }) {
    await this.publish(dto.correlationId, 'project.get', dto);
    return { status: 'queued', correlationId: dto.correlationId, message: 'Fetch project requested', dto };
  }

  async getAllProjects(dto: { correlationId: string }) {
    await this.publish(dto.correlationId, 'project.list', {});
    return { status: 'queued', correlationId: dto.correlationId, message: 'Fetch all projects requested' };
  }
}
