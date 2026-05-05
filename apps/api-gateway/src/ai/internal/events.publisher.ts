import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventsPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  boardReady(project: any, board: any) {
    this.eventEmitter.emit('board.ready', {
      project,
      board,
    });
  }

  projectBuilt(projectId: string) {
    this.eventEmitter.emit('ai.project.built', {
      projectId,
    });
  }
}
