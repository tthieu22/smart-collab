import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Logger, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { LockService } from './services/lock.service';
import { EmitService } from './services/emit.service';
import { BoardService } from './services/board.service';
import { ColumnService } from './services/column.service';
import { CardService } from './services/card.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private userSockets = new Map<string, { userId: string }>();
  private userIdToClients = new Map<string, Set<string>>();

  private lockService: LockService;
  private emitService!: EmitService;

  private boardService!: BoardService;
  private columnService!: ColumnService;
  private cardService!: CardService;

  constructor(
    private readonly jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    this.lockService = new LockService(redis);
  }

  afterInit(server: Server) {
    const pub = this.redis.duplicate();
    const sub = this.redis.duplicate();
    server.adapter(createAdapter(pub, sub));
    this.emitService = new EmitService(server, this.userIdToClients);
    this.logger.log('WebSocket server initialized with Redis adapter');
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token as string | undefined;
    if (!token) {
      this.logger.warn(`🔌 Missing token for client ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token) as { sub: string; projectIds?: string[] };
      const userId = payload.sub;
      (client as any).user = payload;

      this.userSockets.set(client.id, { userId });
      if (!this.userIdToClients.has(userId)) this.userIdToClients.set(userId, new Set());
      this.userIdToClients.get(userId)!.add(client.id);

      this.logger.log(`🔌 User connected: ${userId} (${client.id})`);

      payload.projectIds?.forEach(pid => {
        client.join(pid);
        this.logger.log(`🔒 Auto-joined project room ${pid} for client ${client.id}`);
      });
    } catch (err) {
      this.logger.warn(`❌ Invalid token, disconnecting client ${client.id}`);
      client.disconnect();
      return;
    }

    client.on('joinProject', (pid, cb) => {
      client.join(pid);
      this.logger.log(`🟢 Client ${client.id} joined project ${pid}`);
      cb?.(true);
    });

    client.on('leaveProject', (pid, cb) => {
      client.leave(pid);
      this.logger.log(`🔴 Client ${client.id} left project ${pid}`);
      cb?.(true);
    });

    client.on('board.create', async (payload, cb) => {
      try {
        const { projectId, type, title } = payload;
        const userId = (client as any).user.sub;
        await this.boardService.createBoard({ projectId, ownerId: userId, type, title });
        cb?.({ status: 'success', message: 'Board create request sent' });
      } catch (err) {
        cb?.({ status: 'error', message: err instanceof Error ? err.message : err });
      }
    });

    client.on('board.update', async (payload, cb) => {
      try {
        const { projectId, boardId, ...updates } = payload;
        await this.boardService.updateBoard({ projectId, boardId, ...updates });
        cb?.({ status: 'success', message: 'Board update request sent' });
      } catch (err) {
        cb?.({ status: 'error', message: err instanceof Error ? err.message : err });
      }
    });

    client.on('board.delete', async (payload, cb) => {
      try {
        const { projectId, boardId } = payload;
        await this.boardService.deleteBoard({ projectId, boardId });
        cb?.({ status: 'success', message: 'Board delete request sent' });
      } catch (err) {
        cb?.({ status: 'error', message: err instanceof Error ? err.message : err });
      }
    });

    // ---------------- COLUMN ----------------
    client.on('column.create', async (payload, cb) => {
      try {
        const userId = (client as any).user.sub;
        await this.columnService.createColumn({ ...payload, ownerId: userId });
        cb?.({ status: 'success', message: 'Column create request sent' });
      } catch (err) {
        cb?.({ status: 'error', message: err instanceof Error ? err.message : err });
      }
    });

    client.on('column.update', async (payload, cb) => {
      try {
        await this.columnService.updateColumn(payload);
        cb?.({ status: 'success', message: 'Column update request sent' });
      } catch (err) {
        cb?.({ status: 'error', message: err instanceof Error ? err.message : err });
      }
    });

    client.on('column.delete', async (payload, cb) => {
      try {
        await this.columnService.deleteColumn(payload);
        cb?.({ status: 'success', message: 'Column delete request sent' });
      } catch (err) {
        cb?.({ status: 'error', message: err instanceof Error ? err.message : err });
      }
    });

    // ---------------- CARD ----------------
    client.on('card.create', async (payload, cb) => {
      try {
        await this.cardService.createCard(payload);
        cb?.({ status: 'success', message: 'Card create request sent' });
      } catch (err) {
        cb?.({ status: 'error', message: err instanceof Error ? err.message : err });
      }
    });

    client.on('card.update', async (payload, cb) => {
      try {
        await this.cardService.updateCard(payload);
        cb?.({ status: 'success', message: 'Card update request sent' });
      } catch (err) {
        cb?.({ status: 'error', message: err instanceof Error ? err.message : err });
      }
    });

    client.on('card.delete', async (payload, cb) => {
      try {
        const userId = (client as any).user.sub;
        await this.deleteCard(payload.projectId, payload.cardId, userId, payload);
        cb?.({ status: 'success', message: 'Card delete emitted' });
      } catch (err) {
        cb?.({ status: 'error', message: err instanceof Error ? err.message : err });
      }
    });

    client.on('card.move', async (payload, cb) => {
      try {
        const userId = (client as any).user.sub;
        await this.moveCard(payload.projectId, payload.cardId, userId, payload);
        cb?.({ status: 'success', message: 'Card move emitted' });
      } catch (err) {
        cb?.({ status: 'error', message: err instanceof Error ? err.message : err });
      }
    });

    client.on('card.copy', async (payload, cb) => {
      try {
        const userId = (client as any).user.sub;
        await this.copyCard(payload.projectId, payload.cardId, userId, payload);
        cb?.({ status: 'success', message: 'Card copy emitted' });
      } catch (err) {
        cb?.({ status: 'error', message: err instanceof Error ? err.message : err });
      }
    });
  }

  async handleDisconnect(client: Socket) {
    const info = this.userSockets.get(client.id);
    if (!info) return;

    this.userSockets.delete(client.id);
    const clients = this.userIdToClients.get(info.userId);
    clients?.delete(client.id);
    if (!clients || clients.size === 0) this.userIdToClients.delete(info.userId);

    await this.lockService.releaseAllLocksForUser(info.userId);
    this.logger.log(`❌ Client disconnected: ${client.id} (User: ${info.userId})`);
  }

  // ---------------- Actions (Lock-aware + Emit) ----------------
  moveCard(projectId: string, cardId: string, userId: string, data: any, excludeClientId?: string) {
    this.logger.debug(`[LOCK] Attempting moveCard lock: project=${projectId}, card=${cardId}, user=${userId}`);
    return this.lockService.emitWithLock(projectId, cardId, userId, () => {
      this.logger.log(`📦 moveCard emitted: project=${projectId}, card=${cardId}, user=${userId}`);
      this.emitService.emitToProject(projectId, 'card.move', data, excludeClientId);
    });
  }

  copyCard(projectId: string, cardId: string, userId: string, data: any, excludeClientId?: string) {
    this.logger.debug(`[LOCK] Attempting copyCard lock: project=${projectId}, card=${cardId}, user=${userId}`);
    return this.lockService.emitWithLock(projectId, cardId, userId, () => {
      this.logger.log(`📄 copyCard emitted: project=${projectId}, card=${cardId}, user=${userId}`);
      this.emitService.emitToProject(projectId, 'card.copy', data, excludeClientId);
    });
  }

  moveColumn(projectId: string, columnId: string, userId: string, data: any, excludeClientId?: string) {
    this.logger.debug(`[LOCK] Attempting moveColumn lock: project=${projectId}, column=${columnId}, user=${userId}`);
    return this.lockService.emitWithLock(projectId, columnId, userId, () => {
      this.logger.log(`📊 moveColumn emitted: project=${projectId}, column=${columnId}, user=${userId}`);
      this.emitService.emitToProject(projectId, 'column.move', data, excludeClientId);
    });
  }

  deleteCard(projectId: string, cardId: string, userId: string, data: any, excludeClientId?: string) {
    this.logger.debug(`[LOCK] Attempting deleteCard lock: project=${projectId}, card=${cardId}, user=${userId}`);
    return this.lockService.emitWithLock(projectId, cardId, userId, () => {
      this.logger.log(`🗑 deleteCard emitted: project=${projectId}, card=${cardId}, user=${userId}`);
      this.emitService.emitToProject(projectId, 'card.delete', data, excludeClientId);
    });
  }

  // ---------------- Generic Emit Methods ----------------
  emitToProject(projectId: string, event: string, data: any, excludeClientId?: string) {
    this.logger.debug(`📡 emitToProject: project=${projectId}, event=${event}`);
    this.emitService.emitToProject(projectId, event, data, excludeClientId);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.logger.debug(`📡 emitToUser: user=${userId}, event=${event}`);
    this.emitService.emitToUser(userId, event, data);
  }
}
