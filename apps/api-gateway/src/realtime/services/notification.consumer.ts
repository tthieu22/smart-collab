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
    queue: 'realtime_notification_queue',
  })
  public async handleNotification(msg: any) {
    this.logger.log(`Received notification: ${JSON.stringify(msg)}`);
    
    // Support both direct messages and pattern/data wrapped messages
    const notification = msg.data || msg;
    const { recipientId } = notification;

    if (recipientId) {
      this.gateway.emitToUser(recipientId, 'realtime.notification.created', notification);
    }
  }
}
