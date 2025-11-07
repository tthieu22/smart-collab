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

  constructor(
    private readonly jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly boardService: BoardService,
    private readonly columnService: ColumnService,
    private readonly cardService: CardService,
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

    // Join/Leave helpers
    client.on('joinProject', (pid: string, cb?: (ok: boolean) => void) => {
      client.join(pid);
      this.logger.log(`🟢 Client ${client.id} joined project ${pid}`);
      cb?.(true);
    });

    client.on('leaveProject', (pid: string, cb?: (ok: boolean) => void) => {
      client.leave(pid);
      this.logger.log(`🔴 Client ${client.id} left project ${pid}`);
      cb?.(true);
    });

    // Generic response helper to requestor
    const replyToRequester = (c: Socket, correlationId: string | undefined, payload: any) => {
      const msg = { correlationId, ...payload };
      // dedicated correlation event for responses
      c.emit('realtime.action.response', msg);
    };

    // ---------------- BOARD ----------------
    client.on('board.create', async (payload: any, cb?: (res: any) => void) => {
      const correlationId = payload?.correlationId as string | undefined;
      cb?.({ status: 'received' });

      try {
        const userId = (client as any).user.sub;
        const result = await this.boardService.createBoard({ projectId: payload.projectId, ownerId: userId, type: payload.type, title: payload.title });

        // emit to project room with correlationId
        this.emitService.emitToProject(payload.projectId, 'realtime.board.created', { board: result, correlationId }, client.id);

        // reply to requester
        replyToRequester(client, correlationId, { status: 'success', data: result });
      } catch (err) {
        replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    });

    client.on('board.update', async (payload: any, cb?: (res: any) => void) => {
      const correlationId = payload?.correlationId as string | undefined;
      cb?.({ status: 'received' });

      try {
        const result = await this.boardService.updateBoard({ projectId: payload.projectId, boardId: payload.boardId, ...payload });
        this.emitService.emitToProject(payload.projectId, 'realtime.board.updated', { board: result, correlationId }, client.id);
        replyToRequester(client, correlationId, { status: 'success', data: result });
      } catch (err) {
        replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    });

    client.on('board.delete', async (payload: any, cb?: (res: any) => void) => {
      const correlationId = payload?.correlationId as string | undefined;
      cb?.({ status: 'received' });

      try {
        await this.boardService.deleteBoard({ projectId: payload.projectId, boardId: payload.boardId });
        this.emitService.emitToProject(payload.projectId, 'realtime.board.deleted', { boardId: payload.boardId, correlationId }, client.id);
        replyToRequester(client, correlationId, { status: 'success' });
      } catch (err) {
        replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    });

    // ---------------- COLUMN ----------------
    client.on('column.create', async (payload: any, cb?: (res: any) => void) => {
      const correlationId = payload?.correlationId as string | undefined;
      cb?.({ status: 'received' });

      try {
        const userId = (client as any).user.sub;
        const result = await this.columnService.createColumn({ ...payload, ownerId: userId });
        this.emitService.emitToProject(payload.projectId, 'realtime.column.created', { boardId: payload.boardId, column: result, correlationId }, client.id);
        replyToRequester(client, correlationId, { status: 'success', data: result });
      } catch (err) {
        replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    });

    client.on('column.update', async (payload: any, cb?: (res: any) => void) => {
      const correlationId = payload?.correlationId as string | undefined;
      cb?.({ status: 'received' });

      try {
        const result = await this.columnService.updateColumn(payload);
        this.emitService.emitToProject(payload.projectId, 'realtime.column.updated', { column: result, correlationId }, client.id);
        replyToRequester(client, correlationId, { status: 'success', data: result });
      } catch (err) {
        replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    });

    client.on('column.delete', async (payload: any, cb?: (res: any) => void) => {
      const correlationId = payload?.correlationId as string | undefined;
      cb?.({ status: 'received' });

      try {
        await this.columnService.deleteColumn(payload);
        this.emitService.emitToProject(payload.projectId, 'realtime.column.deleted', { columnId: payload.columnId, correlationId }, client.id);
        replyToRequester(client, correlationId, { status: 'success' });
      } catch (err) {
        replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    });

    // client.on('column.move', async (payload: any, cb?: (res: any) => void) => {
    //   const correlationId = payload?.correlationId as string | undefined;
    //   cb?.({ status: 'received' });

    //   const userId = (client as any).user.sub;
    //   // Use lockService.emitWithLock to protect column move
    //   this.lockService.emitWithLock(payload.projectId, payload.columnId, userId, async () => {
    //     try {
    //       const result = await this.columnService.moveColumn(payload);
    //       this.emitService.emitToProject(payload.projectId, 'realtime.column.moved', { srcBoardId: payload.srcBoardId, destBoardId: payload.destBoardId, columnId: payload.columnId, destIndex: payload.destIndex, correlationId }, client.id);
    //       replyToRequester(client, correlationId, { status: 'success', data: result });
    //     } catch (err) {
    //       replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
    //     }
    //   }).catch((err) => {
    //     // if lock can't be acquired emit lock response
    //     if (err === 'lock') replyToRequester(client, correlationId, { status: 'error', message: 'lock' });
    //     else replyToRequester(client, correlationId, { status: 'error', message: String(err) });
    //   });
    // });

    // ---------------- CARD ----------------
    client.on('card.create', async (payload: any, cb?: (res: any) => void) => {
      const correlationId = payload?.correlationId as string | undefined;
      cb?.({ status: 'received' });

      try {
        const userId = (client as any).user.sub;
        const result = await this.cardService.createCard({ ...payload, ownerId: userId });
        this.emitService.emitToProject(payload.projectId, 'realtime.card.created', { card: result, correlationId }, client.id);
        replyToRequester(client, correlationId, { status: 'success', data: result });
      } catch (err) {
        replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    });

    client.on('card.update', async (payload: any, cb?: (res: any) => void) => {
      const correlationId = payload?.correlationId as string | undefined;
      cb?.({ status: 'received' });

      try {
        const result = await this.cardService.updateCard(payload);
        this.emitService.emitToProject(payload.projectId, 'realtime.card.updated', { card: result, correlationId }, client.id);
        replyToRequester(client, correlationId, { status: 'success', data: result });
      } catch (err) {
        replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    });

    client.on('card.delete', (payload: any, cb?: (res: any) => void) => {
      const correlationId = payload?.correlationId as string | undefined;
      cb?.({ status: 'received' });

      const userId = (client as any).user.sub;
      this.lockService.emitWithLock(payload.projectId, payload.cardId, userId, async () => {
        try {
          await this.cardService.deleteCard(payload);
          this.emitService.emitToProject(payload.projectId, 'realtime.card.deleted', { columnId: payload.columnId, cardId: payload.cardId, correlationId }, client.id);
          replyToRequester(client, correlationId, { status: 'success' });
        } catch (err) {
          replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
        }
      }).catch((err) => {
        if (err === 'lock') replyToRequester(client, correlationId, { status: 'error', message: 'lock' });
        else replyToRequester(client, correlationId, { status: 'error', message: String(err) });
      });
    });

    client.on('card.move', (payload: any, cb?: (res: any) => void) => {
      const correlationId = payload?.correlationId as string | undefined;
      cb?.({ status: 'received' });

      const userId = (client as any).user.sub;
      this.lockService.emitWithLock(payload.projectId, payload.cardId, userId, async () => {
        try {
          await this.cardService.moveCard(payload);
          this.emitService.emitToProject(payload.projectId, 'realtime.card.moved', { srcColumnId: payload.srcColumnId, cardId: payload.cardId, newColumnId: payload.newColumnId, newIndex: payload.newIndex, correlationId }, client.id);
          replyToRequester(client, correlationId, { status: 'success' });
        } catch (err) {
          replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
        }
      }).catch((err) => {
        if (err === 'lock') replyToRequester(client, correlationId, { status: 'error', message: 'lock' });
        else replyToRequester(client, correlationId, { status: 'error', message: String(err) });
      });
    });

    // client.on('card.copy', (payload: any, cb?: (res: any) => void) => {
    //   const correlationId = payload?.correlationId as string | undefined;
    //   cb?.({ status: 'received' });

    //   const userId = (client as any).user.sub;
    //   this.lockService.emitWithLock(payload.projectId, payload.cardId, userId, async () => {
    //     try {
    //       const result = await this.cardService.copyCard(payload);
    //       this.emitService.emitToProject(payload.projectId, 'realtime.card.copied', { card: result, correlationId }, client.id);
    //       replyToRequester(client, correlationId, { status: 'success', data: result });
    //     } catch (err) {
    //       replyToRequester(client, correlationId, { status: 'error', message: err instanceof Error ? err.message : String(err) });
    //     }
    //   }).catch((err) => {
    //     if (err === 'lock') replyToRequester(client, correlationId, { status: 'error', message: 'lock' });
    //     else replyToRequester(client, correlationId, { status: 'error', message: String(err) });
    //   });
    // });
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
