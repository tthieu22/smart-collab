import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';

interface ProjectMessage {
  correlationId: string;
  projectId?: string;
  name?: string;
  description?: string;
  userId?: string;
  role?: string;
  [key: string]: any; // fallback cho trường phát sinh thêm
}

@Injectable()
export class ProjectRealtimeConsumer {
  constructor(private readonly gateway: RealtimeGateway) {}

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.created',
    queue: 'realtime-service.project.created',
  })
  async handleProjectCreated(msg: ProjectMessage) {
    console.log('📩 project.created:', msg);
    this.gateway.emitEvent('project.created', {
      correlationId: msg.correlationId,
      data: msg,
    });
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.updated',
    queue: 'realtime-service.project.updated',
  })
  async handleProjectUpdated(msg: ProjectMessage) {
    console.log('📩 project.updated:', msg);
    this.gateway.emitEvent('project.updated', {
      correlationId: msg.correlationId,
      data: msg,
    });
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.deleted',
    queue: 'realtime-service.project.deleted',
  })
  async handleProjectDeleted(msg: ProjectMessage) {
    console.log('📩 project.deleted:', msg);
    this.gateway.emitEvent('project.deleted', {
      correlationId: msg.correlationId,
      data: msg,
    });
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.fetched',
    queue: 'realtime-service.project.fetched',
  })
  async handleProjectFetched(msg: ProjectMessage) {
    console.log('📩 project.fetched:', msg);
    this.gateway.emitEvent('project.fetched', {
      correlationId: msg.correlationId,
      data: msg,
    });
  }
  
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.listed',
    queue: 'realtime-service.project.listed',
  })
  async handleProjectListed(msg: ProjectMessage) {
    console.log('📩 project.listed:', msg);

    this.gateway.emitEvent('project.listed', {
      correlationId: msg.correlationId,
      data: msg.projects, // gửi danh sách project
    });
  }
}
