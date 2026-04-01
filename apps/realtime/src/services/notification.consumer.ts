import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';

@Injectable()
export class NotificationConsumer {
  private readonly logger = new Logger('NotificationConsumer');

  constructor(private readonly gateway: RealtimeGateway) {}

  @RabbitSubscribe({
    exchange: 'notification_exchange',
    routingKey: 'notification_routing_key',
    queue: 'notification_queue',
  })
  public async handleNotification(msg: any) {
    this.logger.log(`Received notification from Java: ${JSON.stringify(msg)}`);
    
    // The message from Java already contains: id, recipientId, senderId, type, postId, commentId, createdAt
    const { recipientId } = msg;

    if (recipientId) {
      this.gateway.emitToUser(recipientId, 'realtime.notification.created', msg);
    }
  }
}
