// apps/api-gateway/src/project/project.service.ts
import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ProjectService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async createProject(dto: { name: string; description?: string }) {
    await this.amqpConnection.publish(
      'smart-collab',
      'project.create',
      dto,
    );
    return { status: 'queued', message: 'Project creation requested', dto };
  }
}
