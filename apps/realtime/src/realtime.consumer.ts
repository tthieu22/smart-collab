import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeConsumer {
  constructor(private readonly gateway: RealtimeGateway) {}

  // PROJECT EVENTS
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.created',
    queue: 'realtime-service',
  })
  async handleProjectCreated(msg: any) {
    console.log('📩 [Realtime Service] project.created:', msg);
    this.gateway.emitEvent('project.created', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.updated',
    queue: 'realtime-service',
  })
  async handleProjectUpdated(msg: any) {
    console.log('📩 [Realtime Service] project.updated:', msg);
    this.gateway.emitEvent('project.updated', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.deleted',
    queue: 'realtime-service',
  })
  async handleProjectDeleted(msg: any) {
    console.log('📩 [Realtime Service] project.deleted:', msg);
    this.gateway.emitEvent('project.deleted', msg);
  }

  // MEMBER EVENTS
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_added',
    queue: 'realtime-service',
  })
  async handleMemberAdded(msg: any) {
    console.log('📩 [Realtime Service] project.member_added:', msg);
    this.gateway.emitEvent('project.member_added', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_removed',
    queue: 'realtime-service',
  })
  async handleMemberRemoved(msg: any) {
    console.log('📩 [Realtime Service] project.member_removed:', msg);
    this.gateway.emitEvent('project.member_removed', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_role_updated',
    queue: 'realtime-service',
  })
  async handleMemberRoleUpdated(msg: any) {
    console.log('📩 [Realtime Service] project.member_role_updated:', msg);
    this.gateway.emitEvent('project.member_role_updated', msg);
  }

  // FETCHED PROJECT EVENT
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.fetched',
    queue: 'realtime-service',
  })
  async handleProjectFetched(msg: any) {
    console.log('📩 [Realtime Service] project.fetched:', msg);
    this.gateway.emitEvent('project.fetched', msg);
  }
}
