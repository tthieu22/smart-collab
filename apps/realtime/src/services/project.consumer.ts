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
    routingKey: 'board.created',
    queue: 'realtime_board_created_queue',
  })
  public async handleBoardCreated(msg: any) {
    this.logger.log(`[EVENT] Received board.created: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.board) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.board.created', msg.board);
    }
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'board.deleted',
    queue: 'realtime_board_deleted_queue',
  })
  public async handleBoardDeleted(msg: any) {
    this.logger.log(`[EVENT] Received board.deleted: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.boardId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.board.deleted', {
        projectId: msg.projectId,
        boardId: msg.boardId
      });
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
  
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.project.chat',
    queue: 'realtime_project_chat_queue',
  })
  public async handleProjectChat(msg: any) {
    this.logger.log(`[CHAT] Received message for project ${msg?.projectId}`);
    if (msg?.projectId && msg?.message) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.project.chat', msg);
    }
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.recycle.added',
    queue: 'realtime_recycle_added_queue',
  })
  public async handleRecycleAdded(msg: any) {
    this.logger.log(`[RECYCLE] Item added for project ${msg?.projectId}`);
    if (msg?.projectId && msg?.item) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.recycle.added', msg.item);
    }
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'realtime.recycle.removed',
    queue: 'realtime_recycle_removed_queue',
  })
  public async handleRecycleRemoved(msg: any) {
    this.logger.log(`[RECYCLE] Item removed for project ${msg?.projectId}`);
    if (msg?.projectId && msg?.itemId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.recycle.removed', { id: msg.itemId });
    }
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'card.deleted',
    queue: 'realtime_card_deleted_queue',
  })
  public async handleCardDeleted(msg: any) {
    this.logger.log(`[EVENT] Received card.deleted: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.cardId && msg?.columnId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.card.deleted', {
        projectId: msg.projectId,
        columnId: msg.columnId,
        cardId: msg.cardId
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'card.created',
    queue: 'realtime_card_created_queue',
  })
  public async handleCardCreated(msg: any) {
    this.logger.log(`[EVENT] Received card.created: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.card) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.card.created', {
        ...msg.card,
        columnId: msg.columnId
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'card.updated',
    queue: 'realtime_card_updated_queue',
  })
  public async handleCardUpdated(msg: any) {
    this.logger.log(`[EVENT] Received card.updated: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.card) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.card.updated', msg.card);
    }
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'card.moved',
    queue: 'realtime_card_moved_queue',
  })
  public async handleCardMoved(msg: any) {
    this.logger.log(`[EVENT] Received card.moved: ${JSON.stringify(msg)}`);
    if (msg?.projectId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.card.moved', msg);
    }
  }
}
