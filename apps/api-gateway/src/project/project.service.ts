import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { randomUUID } from 'crypto';

@Injectable()
export class ProjectService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  private publish(correlationId: string, routingKey: string, payload: any) {
    return this.amqpConnection.publish('smart-collab', routingKey, { correlationId, ...payload });
  }

  async createProject(dto: { name: string; description?: string }) {
    const correlationId = randomUUID();
    await this.publish(correlationId, 'project.create', dto);
    return { status: 'queued', correlationId, message: 'Project creation requested', dto };
  }

  async updateProject(dto: { projectId: string; name?: string; description?: string }) {
    const correlationId = randomUUID();
    await this.publish(correlationId, 'project.update', dto);
    return { status: 'queued', correlationId, message: 'Project update requested', dto };
  }

  async deleteProject(dto: { projectId: string }) {
    const correlationId = randomUUID();
    await this.publish(correlationId, 'project.delete', dto);
    return { status: 'queued', correlationId, message: 'Project deletion requested', dto };
  }

  async addMember(dto: { projectId: string; userId: string; role?: string }) {
    const correlationId = randomUUID();
    await this.publish(correlationId, 'project.member.add', dto);
    return { status: 'queued', correlationId, message: 'Add member requested', dto };
  }

  async removeMember(dto: { projectId: string; userId: string }) {
    const correlationId = randomUUID();
    await this.publish(correlationId, 'project.member.remove', dto);
    return { status: 'queued', correlationId, message: 'Remove member requested', dto };
  }

  async updateMemberRole(dto: { projectId: string; userId: string; role: string }) {
    const correlationId = randomUUID();
    await this.publish(correlationId, 'project.member.update_role', dto);
    return { status: 'queued', correlationId, message: 'Update member role requested', dto };
  }

  async getProject(dto: { projectId: string }) {
    const correlationId = randomUUID();
    await this.publish(correlationId, 'project.get', dto);
    return { status: 'queued', correlationId, message: 'Fetch project requested', dto };
  }
}
