import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';

@Injectable()
export class ProjectConsumer {
  private readonly logger = new Logger('ProjectConsumer');

  constructor(private readonly gateway: RealtimeGateway) {}

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.project.updated',
    queue: 'realtime_project_updates_queue',
  })
  public async handleProjectUpdate(msg: any) {
    this.logger.log(`Received project update from Project Service: ${msg?.project?.id}`);
    
    if (msg?.project?.id) {
      this.gateway.server.to(`project:${msg.project.id}`).emit('realtime.project.updated', msg.project);
    }
  }
}
