import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';

@Injectable()
export class MemberRealtimeConsumer {
  constructor(private readonly gateway: RealtimeGateway) {}

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_added',
    queue: 'realtime-service.project.member_added', // queue tách riêng
  })
  async handleMemberAdded(msg: any) {
    console.log('📩 [MemberRealtimeConsumer] project.member_added received:');
    console.log('   message:', msg);
    console.log('   type of message:', typeof msg);
    console.log('   keys:', Object.keys(msg));

    if (msg.userId && msg.projectId) {
      console.log(`   Member added: userId=${msg.userId}, projectId=${msg.projectId}`);
    } else {
      console.log('   ⚠️ Message missing userId or projectId');
    }

    this.gateway.emitEvent('project.member_added', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_removed',
    queue: 'realtime-service.project.member_removed', // queue tách riêng
  })
  async handleMemberRemoved(msg: any) {
    console.log('📩 [MemberRealtimeConsumer] project.member_removed received:', msg);
    this.gateway.emitEvent('project.member_removed', msg);
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_role_updated',
    queue: 'realtime-service.project.member_role_updated', // queue tách riêng
  })
  async handleMemberRoleUpdated(msg: any) {
    console.log('📩 [MemberRealtimeConsumer] project.member_role_updated received:', msg);
    this.gateway.emitEvent('project.member_role_updated', msg);
  }
}
