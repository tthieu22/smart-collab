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

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'column.created',
    queue: 'realtime_column_created_queue',
  })
  public async handleColumnCreated(msg: any) {
    this.logger.log(`[EVENT] Received column.created: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.column) {
      const boardId = msg.column.boardId;
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.column.created', {
        ...msg.column,
        boardId
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'column.updated',
    queue: 'realtime_column_updated_queue',
  })
  public async handleColumnUpdated(msg: any) {
    this.logger.log(`[EVENT] Received column.updated: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.column) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.column.updated', msg.column);
    }
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'column.moved',
    queue: 'realtime_column_moved_queue',
  })
  public async handleColumnMoved(msg: any) {
    this.logger.log(`[EVENT] Received column.moved: ${JSON.stringify(msg)}`);
    if (msg?.projectId) {
      // For moves, we emit the specialized moved event with srcBoardId, destBoardId, etc.
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.column.moved', msg);
    }
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'column.deleted',
    queue: 'realtime_column_deleted_queue',
  })
  public async handleColumnDelete(msg: any) {
    this.logger.log(`[EVENT] Received column.deleted: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.columnId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.column.deleted', {
        projectId: msg.projectId,
        boardId: msg.boardId,
        columnId: msg.columnId
      });
    }
  }
}
