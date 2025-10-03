import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';

@Injectable()
export class MemberRealtimeConsumer {
  constructor(private readonly gateway: RealtimeGateway) {}

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_added',
    queue: 'realtime-service',
  })
  async handleMemberAdded(msg: any) {
    console.log('📩 project.member_added:', msg);
    this.gateway.emitEvent('project.member_added', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_removed',
    queue: 'realtime-service',
  })
  async handleMemberRemoved(msg: any) {
    console.log('📩 project.member_removed:', msg);
    this.gateway.emitEvent('project.member_removed', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_role_updated',
    queue: 'realtime-service',
  })
  async handleMemberRoleUpdated(msg: any) {
    console.log('📩 project.member_role_updated:', msg);
    this.gateway.emitEvent('project.member_role_updated', msg);
  }
}
