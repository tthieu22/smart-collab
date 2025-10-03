import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';

@Injectable()
export class ProjectRealtimeConsumer {
  constructor(private readonly gateway: RealtimeGateway) {}

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.created',
    queue: 'realtime-service',
  })
  async handleProjectCreated(msg: any) {
    console.log('📩 project.created:', msg);
    this.gateway.emitEvent('project.created', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.updated',
    queue: 'realtime-service',
  })
  async handleProjectUpdated(msg: any) {
    console.log('📩 project.updated:', msg);
    this.gateway.emitEvent('project.updated', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.deleted',
    queue: 'realtime-service',
  })
  async handleProjectDeleted(msg: any) {
    console.log('📩 project.deleted:', msg);
    this.gateway.emitEvent('project.deleted', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.fetched',
    queue: 'realtime-service',
  })
  async handleProjectFetched(msg: any) {
    console.log('📩 project.fetched:', msg);
    this.gateway.emitEvent('project.fetched', msg);
  }
}
