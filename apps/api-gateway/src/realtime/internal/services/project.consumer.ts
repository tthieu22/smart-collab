import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RealtimeGateway } from '../realtime.gateway';

@Injectable()
export class ProjectConsumer {
  private readonly logger = new Logger(ProjectConsumer.name);

  constructor(private readonly gateway: RealtimeGateway) { }


  @OnEvent('realtime.project.deleted')
  public async handleProjectDeleted(msg: any) {
    this.logger.log(`[EVENT] Received project.deleted: ${JSON.stringify(msg)}`);
    if (msg?.projectId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.project.deleted', { projectId: msg.projectId });
    }
  }

  @OnEvent('realtime.project.restored')
  public async handleProjectRestored(msg: any) {
    this.logger.log(`[EVENT] Received project.restored: ${JSON.stringify(msg)}`);
    if (msg?.projectId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.project.restored', { projectId: msg.projectId });
    }
  }

  @OnEvent('project.recycle.item_added')
  public async handleRecycleAdded(msg: any) {
    this.logger.log(`[RECYCLE] Item added for project ${msg?.projectId}`);
    if (msg?.projectId && msg?.item) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.recycle.added', msg.item);
    }
  }

  @OnEvent('project.recycle.item_removed')
  public async handleRecycleRemoved(msg: any) {
    this.logger.log(`[RECYCLE] Item removed for project ${msg?.projectId}`);
    if (msg?.projectId && msg?.itemId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.recycle.removed', { id: msg.itemId });
    }
  }

  @OnEvent('card.deleted')
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

  @OnEvent('card.created')
  public async handleCardCreated(msg: any) {
    this.logger.log(`[EVENT] Received card.created: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.card) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.card.created', {
        ...msg.card,
        columnId: msg.columnId
      });
    }
  }

  @OnEvent('card.updated')
  public async handleCardUpdated(msg: any) {
    this.logger.log(`[EVENT] Received card.updated: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.card) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.card.updated', msg.card);
    }
  }

  @OnEvent('card.moved')
  public async handleCardMoved(msg: any) {
    this.logger.log(`[EVENT] Received card.moved: ${JSON.stringify(msg)}`);
    if (msg?.projectId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.card.moved', msg);
    }
  }

  @OnEvent('realtime.meeting.invite')
  public async handleMeetingInvite(msg: any) {
    this.logger.log(`[MEETING] Invite for project ${msg?.projectId}, participants: ${msg?.participants?.length}`);
    if (msg?.participants && Array.isArray(msg.participants)) {
      msg.participants.forEach((userId: string) => {
        this.gateway.emitToUser(userId, 'realtime.meeting.invite', msg);
      });
    }
  }

  @OnEvent('notification.created')
  public async handleNotificationCreated(msg: any) {
    this.logger.log(`[NOTIFICATION] New notification for user ${msg?.recipientId}`);
    if (msg?.recipientId) {
      this.gateway.emitToUser(msg.recipientId, 'realtime.notification.new', msg);
    }
  }

  @OnEvent('board.ready')
  public async handleBoardReady(msg: any) {
    this.logger.log(`[AI] Board ready for project ${msg?.project?.id}`);
    if (msg?.project?.id) {
      this.gateway.server.to(`project:${msg.project.id}`).emit('realtime.board.ready', msg);
    }
  }

  @OnEvent('board.created')
  public async handleBoardCreated(msg: any) {
    this.logger.log(`[EVENT] Received board.created: ${JSON.stringify(msg)}`);
    if (msg?.board?.projectId) {
      this.gateway.server.to(`project:${msg.board.projectId}`).emit('realtime.board.created', msg.board);
    }
  }

  @OnEvent('board.updated')
  public async handleBoardUpdated(msg: any) {
    this.logger.log(`[EVENT] Received board.updated: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.board) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.board.updated', msg.board);
    }
  }

  @OnEvent('realtime.project.updated')
  public async handleProjectUpdated(msg: any) {
    this.logger.log(`[EVENT] Received project.updated: ${JSON.stringify(msg)}`);
    if (msg?.project?.id) {
      this.gateway.server.to(`project:${msg.project.id}`).emit('realtime.project.updated', msg.project);
    }
  }

  @OnEvent('realtime.project.chat')
  public async handleProjectChat(msg: any) {
    this.logger.log(`[EVENT] Received project.chat for project ${msg?.projectId}`);
    if (msg?.projectId && msg?.message) {
      // Use the gateway's helper to ensure consistent prefixing and diagnostics
      this.gateway.emitToProject(msg.projectId, 'realtime.project.chat', msg);
      this.logger.debug(`[CHAT] Emitted realtime.project.chat to room project:${msg.projectId}`);
    }
  }

  @OnEvent('board.deleted')
  public async handleBoardDeleted(msg: any) {
    if (msg?.projectId && msg?.boardId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.board.deleted', { boardId: msg.boardId });
    }
  }

  @OnEvent('column.created')
  public async handleColumnCreated(msg: any) {
    if (msg?.projectId && msg?.column) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.column.created', { ...msg.column, boardId: msg.boardId });
    }
  }

  @OnEvent('column.updated')
  public async handleColumnUpdated(msg: any) {
    if (msg?.projectId && msg?.column) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.column.updated', msg.column);
    }
  }

  @OnEvent('column.deleted')
  public async handleColumnDeleted(msg: any) {
    if (msg?.projectId && msg?.columnId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.column.deleted', { boardId: msg.boardId, columnId: msg.columnId });
    }
  }

  @OnEvent('column.moved')
  public async handleColumnMoved(msg: any) {
    if (msg?.projectId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.column.moved', msg);
    }
  }

  @OnEvent('project.member_added')
  public async handleMemberAdded(msg: any) {
    if (msg?.projectId && msg?.member) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.project.member_added', msg.member);
    }
  }

  @OnEvent('project.member_removed')
  public async handleMemberRemoved(msg: any) {
    if (msg?.projectId && msg?.userId) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.project.member_removed', { userId: msg.userId });
    }
  }

  @OnEvent('project.member_role_updated')
  public async handleMemberRoleUpdated(msg: any) {
    if (msg?.projectId && msg?.member) {
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.project.member_role_updated', msg.member);
    }
  }

  @OnEvent('card.copied')
  public async handleCardCopied(msg: any) {
    this.logger.log(`[EVENT] Received card.copied: ${JSON.stringify(msg)}`);
    if (msg?.projectId && msg?.card) {
      // Khi copy card, FE coi nó như một card mới được tạo
      this.gateway.server.to(`project:${msg.projectId}`).emit('realtime.card.created', {
        ...msg.card,
        columnId: msg.columnId
      });
    }
  }
}
