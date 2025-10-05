import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';

interface ProjectMessage {
  correlationId: string;
  projectId?: string;
  projects?: any[];
  project?: any;
  userId?: string;
  role?: string;
  member?: any;
  [key: string]: any;
}

@Injectable()
export class ProjectRealtimeConsumer {
  constructor(private readonly gateway: RealtimeGateway) {}

  // ================= PROJECT =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.project.created',
    queue: 'realtime.project.created',
  })
  async handleProjectCreated(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.created:', msg);
    this.gateway.emitEvent('realtime.project.created', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.project.updated',
    queue: 'realtime.project.updated',
  })
  async handleProjectUpdated(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.updated:', msg);
    this.gateway.emitEvent('realtime.project.updated', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.project.deleted',
    queue: 'realtime.project.deleted',
  })
  async handleProjectDeleted(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.deleted:', msg);
    this.gateway.emitEvent('realtime.project.deleted', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.project.fetched',
    queue: 'realtime.project.fetched',
  })
  async handleProjectFetched(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.fetched:', msg);
    this.gateway.emitEvent('realtime.project.fetched', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.project.listed',
    queue: 'realtime.project.listed',
  })
  async handleProjectListed(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.listed:', msg);
    this.gateway.emitEvent('realtime.project.listed', {
      correlationId: msg.correlationId,
      data: msg.projects || [],
    });
  }

  // ================= MEMBER =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.project.member_added',
    queue: 'realtime.project.member_added',
  })
  async handleMemberAdded(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.member_added:', msg);
    this.gateway.emitEvent('realtime.project.member_added', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.project.member_removed',
    queue: 'realtime.project.member_removed',
  })
  async handleMemberRemoved(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.member_removed:', msg);
    this.gateway.emitEvent('realtime.project.member_removed', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.project.member_role_updated',
    queue: 'realtime.project.member_role_updated',
  })
  async handleMemberRoleUpdated(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.member_role_updated:', msg);
    this.gateway.emitEvent('realtime.project.member_role_updated', msg);
  }
}
