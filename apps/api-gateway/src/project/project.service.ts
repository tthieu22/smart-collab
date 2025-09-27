// apps/api-gateway/src/project/project.service.ts
import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { randomUUID } from 'crypto';
@Injectable()
export class ProjectService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async createProject(dto: { name: string; description?: string }) {
    // Publish request -> project.create
    const correlationId = randomUUID();
    await this.amqpConnection.publish(
      'smart-collab',
      'project.create',
      {
        correlationId,
        ...dto,
      }
    );

    return { status: 'queued', correlationId, message: 'Project creation requested', dto };
  }
}
