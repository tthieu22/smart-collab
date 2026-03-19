import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class EventsPublisher {
  constructor(private readonly amqp: AmqpConnection) {}

  boardReady(project: any, board: any) {
    this.amqp.publish('realtime-exchange', 'board.ready', {
      project,
      board,
    });
  }

  projectBuilt(projectId: string) {
    this.amqp.publish('project-exchange', 'ai.project.built', {
      projectId,
    });
  }
}
