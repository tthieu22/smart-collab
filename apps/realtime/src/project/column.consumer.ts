import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';
import { ProjectMessage } from './dto/project.dto';

@Injectable()
export class ColumnConsumer {
  constructor(private readonly gateway: RealtimeGateway) {}

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'column.created',
    queue: 'project-service.column-created',
  })
  async handleColumnCreated(msg: ProjectMessage) {
    console.log('📩 [Realtime] column.created:', msg);

    if (msg.projectId) {
      await this.gateway.emitToProject(msg.projectId, 'realtime.column.created', msg);
    } else if (msg.userId) {
      await this.gateway.emitToUser(msg.userId, 'realtime.column.created', msg);
    } else {
      this.gateway.server.emit('realtime.column.created', msg);
    }

    console.log(`📤 [Emit] column.created → ${msg.projectId ?? msg.userId ?? 'broadcast'}`);
  }
}
