import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';
import { ProjectMessage } from './dto/project.dto';

@Injectable()
export class CardConsumer {
  constructor(private readonly gateway: RealtimeGateway) {}

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'card.created',
    queue: 'project-service.card-created',
  })
  async handleCardCreated(msg: ProjectMessage) {
    console.log('📩 [Realtime] card.created:', msg);

    if (msg.projectId) {
      await this.gateway.emitToProject(msg.projectId, 'realtime.card.created', msg);
    } else if (msg.userId) {
      await this.gateway.emitToUser(msg.userId, 'realtime.card.created', msg);
    } else {
      this.gateway.server.emit('realtime.card.created', msg);
    }

    console.log(`📤 [Emit] card.created → ${msg.projectId ?? msg.userId ?? 'broadcast'}`);
  }
}
