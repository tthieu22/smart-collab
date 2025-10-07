import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';
import { ProjectMessage } from './dto/project.dto';

@Injectable()
export class ProjectRealtimeConsumer {
  constructor(private readonly gateway: RealtimeGateway) {}
  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.created',
    queue: 'realtime-service.created',
  })
  async handleProjectCreated(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.created:', msg);
    this.gateway.emitEvent('realtime.project.created', msg);
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.updated',
    queue: 'realtime-service.updated',
  })
  async handleProjectUpdated(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.updated:', msg);
    this.gateway.emitEvent('realtime.project.updated', msg);
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.deleted',
    queue: 'realtime-service.deleted',
  })
  async handleProjectDeleted(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.deleted:', msg);
    this.gateway.emitEvent('realtime.project.deleted', msg);
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.fetched',
    queue: 'realtime-service.fetched',
  })
  async handleProjectFetched(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.fetched:', msg);
    this.gateway.emitEvent('realtime.project.fetched', msg);
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.listed',
    queue: 'realtime-service.listed',
  })
  async handleProjectListed(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.listed:', msg);
    this.gateway.emitEvent('realtime.project.listed', {
      correlationId: msg.correlationId,
      data: msg.projects || [],
    });
  }

}
