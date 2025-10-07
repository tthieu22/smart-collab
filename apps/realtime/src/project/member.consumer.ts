import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';
import { ProjectMessage } from './dto/project.dto';

@Injectable()
export class MemberRealtimeConsumer {
  constructor(private readonly gateway: RealtimeGateway) {}

  
  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.member_added',
    queue: 'realtime-service.member_added',
  })
  async handleMemberAdded(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.member_added:', msg);
    this.gateway.emitEvent('realtime.project.member_added', msg);
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.member_removed',
    queue: 'realtime-service.member_removed',
  })
  async handleMemberRemoved(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.member_removed:', msg);
    this.gateway.emitEvent('realtime.project.member_removed', msg);
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.member_role_updated',
    queue: 'realtime-service.member_role_updated',
  })
  async handleMemberRoleUpdated(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.member_role_updated:', msg);
    this.gateway.emitEvent('realtime.project.member_role_updated', msg);
  }
}
