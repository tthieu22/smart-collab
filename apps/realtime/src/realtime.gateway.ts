import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
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
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private userSockets = new Map<string, { userId: string }>();
  private userIdToClients = new Map<string, Set<string>>();

  private emitService!: EmitService;

  constructor(
    private readonly jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly boardService: BoardService,
    private readonly columnService: ColumnService,
    private readonly cardService: CardService,
    private readonly lockService: LockService,
  ) {}

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
      const payload = this.jwtService.verify(token) as {
        sub: string;
        projectIds?: string[];
      };
      const userId = payload.sub;
      (client as any).user = payload;

      this.userSockets.set(client.id, { userId });
      if (!this.userIdToClients.has(userId))
        this.userIdToClients.set(userId, new Set());
      this.userIdToClients.get(userId)!.add(client.id);

      this.logger.log(`🔌 User connected: ${userId} (${client.id})`);

      payload.projectIds?.forEach((pid) => {
        client.join(pid);
        this.logger.log(
          `🔒 Auto-joined project room ${pid} for client ${client.id}`,
        );
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

    // ---------------- BOARD ----------------
    // client.on('board.create', async (payload: any, cb?: (res: any) => void) => {
    //   const correlationId = payload?.correlationId as string | undefined;
    //   cb?.({ status: 'received' });

    //   try {
    //     const userId = (client as any).user.sub;
    //     await this.boardService.handleCreateBoard(
    //       {
    //         ...payload,
    //         projectId: payload.projectId,
    //         ownerId: userId,
    //         correlationId,
    //       },
    //       client.id,
    //     );
    //     replyToRequester(client, correlationId, { status: 'pending' });
    //   } catch (err) {
    //     replyToRequester(client, correlationId, {
    //       status: 'error',
    //       message: err instanceof Error ? err.message : String(err),
    //     });
    //   }
    // });

    // client.on('board.update', async (payload: any, cb?: (res: any) => void) => {
    //   const correlationId = payload?.correlationId as string | undefined;
    //   cb?.({ status: 'received' });

    //   try {
    //     await this.boardService.handleUpdateBoard(
    //       {
    //         ...payload,
    //         projectId: payload.projectId,
    //         boardId: payload.boardId,
    //         correlationId,
    //       },
    //       client.id,
    //     );
    //     replyToRequester(client, correlationId, { status: 'pending' });
    //   } catch (err) {
    //     replyToRequester(client, correlationId, {
    //       status: 'error',
    //       message: err instanceof Error ? err.message : String(err),
    //     });
    //   }
    // });

    // client.on('board.delete', async (payload: any, cb?: (res: any) => void) => {
    //   const correlationId = payload?.correlationId as string | undefined;
    //   cb?.({ status: 'received' });

    //   try {
    //     await this.boardService.handleDeleteBoard(
    //       {
    //         ...payload,
    //         projectId: payload.projectId,
    //         boardId: payload.boardId,
    //         correlationId,
    //       },
    //       client.id,
    //     );
    //     replyToRequester(client, correlationId, { status: 'pending' });
    //   } catch (err) {
    //     replyToRequester(client, correlationId, {
    //       status: 'error',
    //       message: err instanceof Error ? err.message : String(err),
    //     });
    //   }
    // });

    // ---------------- COLUMN ----------------
    // client.on(
    //   'column.create',
    //   async (payload: any, cb?: (res: any) => void) => {
    //     const correlationId = payload?.correlationId as string | undefined;
    //     cb?.({ status: 'received' });

    //     try {
    //       const userId = (client as any).user.sub;
    //       await this.columnService.handleCreateColumn(
    //         { ...payload, ownerId: userId, correlationId },
    //         client.id,
    //       );
    //       replyToRequester(client, correlationId, { status: 'pending' });
    //     } catch (err) {
    //       replyToRequester(client, correlationId, {
    //         status: 'error',
    //         message: err instanceof Error ? err.message : String(err),
    //       });
    //     }
    //   },
    // );

    // client.on(
    //   'column.update',
    //   async (payload: any, cb?: (res: any) => void) => {
    //     const correlationId = payload?.correlationId as string | undefined;
    //     cb?.({ status: 'received' });

    //     try {
    //       await this.columnService.handleUpdateColumn(
    //         { ...payload, correlationId },
    //         client.id,
    //       );
    //       replyToRequester(client, correlationId, { status: 'pending' });
    //     } catch (err) {
    //       replyToRequester(client, correlationId, {
    //         status: 'error',
    //         message: err instanceof Error ? err.message : String(err),
    //       });
    //     }
    //   },
    // );

    // client.on(
    //   'column.delete',
    //   async (payload: any, cb?: (res: any) => void) => {
    //     const correlationId = payload?.correlationId as string | undefined;
    //     cb?.({ status: 'received' });

    //     try {
    //       await this.columnService.handleDeleteColumn(
    //         { ...payload, correlationId },
    //         client.id,
    //       );
    //       replyToRequester(client, correlationId, { status: 'pending' });
    //     } catch (err) {
    //       replyToRequester(client, correlationId, {
    //         status: 'error',
    //         message: err instanceof Error ? err.message : String(err),
    //       });
    //     }
    //   },
    // );

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
    // client.on('card.create', async (payload: any, cb?: (res: any) => void) => {
    //   const correlationId = payload?.correlationId as string | undefined;
    //   cb?.({ status: 'received' });

    //   try {
    //     const userId = (client as any).user.sub;
    //     await this.cardService.handleCreateCard(
    //       { ...payload, ownerId: userId, correlationId },
    //       client.id,
    //     );
    //     replyToRequester(client, correlationId, { status: 'pending' });
    //   } catch (err) {
    //     replyToRequester(client, correlationId, {
    //       status: 'error',
    //       message: err instanceof Error ? err.message : String(err),
    //     });
    //   }
    // });

    // client.on('card.update', async (payload: any, cb?: (res: any) => void) => {
    //   const correlationId = payload?.correlationId as string | undefined;
    //   cb?.({ status: 'received' });

    //   try {
    //     await this.cardService.handleUpdateCard(
    //       { ...payload, correlationId },
    //       client.id,
    //     );
    //     replyToRequester(client, correlationId, { status: 'pending' });
    //   } catch (err) {
    //     replyToRequester(client, correlationId, {
    //       status: 'error',
    //       message: err instanceof Error ? err.message : String(err),
    //     });
    //   }
    // });

    // client.on('card.delete', async (payload: any, cb?: (res: any) => void) => {
    //   const correlationId = payload?.correlationId as string | undefined;
    //   cb?.({ status: 'received' });

    //   try {
    //     const userId = (client as any).user.sub;
    //     const result = await this.cardService.handleDeleteCard(
    //       { ...payload, correlationId },
    //       userId,
    //       client.id,
    //     );
    //     if (result.status === 'success') {
    //       replyToRequester(client, correlationId, { status: 'pending' });
    //     } else {
    //       replyToRequester(client, correlationId, {
    //         status: 'error',
    //         message: result.message || 'lock',
    //       });
    //     }
    //   } catch (err) {
    //     replyToRequester(client, correlationId, {
    //       status: 'error',
    //       message: err instanceof Error ? err.message : String(err),
    //     });
    //   }
    // });

    // client.on('card.move', async (payload: any, cb?: (res: any) => void) => {
    //   const correlationId = payload?.correlationId as string | undefined;
    //   cb?.({ status: 'received' });

    //   try {
    //     const userId = (client as any).user.sub;
    //     const result = await this.cardService.handleMoveCard(
    //       {
    //         ...payload,
    //         correlationId,
    //         projectId: payload.projectId,
    //         srcColumnId: payload.srcColumnId,
    //         newColumnId: payload.newColumnId,
    //         newIndex: payload.newIndex,
    //       },
    //       userId,
    //       client.id,
    //     );
    //     if (result.status === 'success') {
    //       replyToRequester(client, correlationId, { status: 'pending' });
    //     } else {
    //       replyToRequester(client, correlationId, {
    //         status: 'error',
    //         message: result.message || 'lock',
    //       });
    //     }
    //   } catch (err) {
    //     replyToRequester(client, correlationId, {
    //       status: 'error',
    //       message: err instanceof Error ? err.message : String(err),
    //     });
    //   }
    // });

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
  // Helper
  private replyToRequester = (
    c: Socket,
    correlationId: string | undefined,
    payload: any,
  ) => {
    const msg = { correlationId, ...payload };
    c.emit('realtime.action.response', msg);
  };
  // Generic Emit Methods
  emitToProject(
    projectId: string,
    event: string,
    data: any,
    excludeClientId?: string,
  ) {
    this.logger.debug(`📡 emitToProject: project=${projectId}, event=${event}`);
    this.emitService.emitToProject(projectId, event, data, excludeClientId);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.logger.debug(`📡 emitToUser: user=${userId}, event=${event}`);
    this.emitService.emitToUser(userId, event, data);
  }

  @SubscribeMessage('card.create')
    async onCardCreate(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
      const correlationId = payload?.correlationId;
      const userId = (client as any).user?.sub;
      this.replyToRequester(client, correlationId, { status: 'received' });

      try {
        await this.cardService.handleCreateCard({ ...payload, ownerId: userId, correlationId }, client.id);
        this.replyToRequester(client, correlationId, { status: 'pending' });
      } catch (err) {
        this.logger.error(`❌ [card.create] ${err instanceof Error ? err.message : err}`);
        this.replyToRequester(client, correlationId, {
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }


  @SubscribeMessage('card.update')
  async onCardUpdate(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const correlationId = payload?.correlationId;
    this.replyToRequester(client, correlationId, { status: 'received' });

    try {
      await this.cardService.handleUpdateCard({ ...payload, correlationId }, client.id);
      this.replyToRequester(client, correlationId, { status: 'pending' });
    } catch (err) {
      this.replyToRequester(client, correlationId, { status: 'error', message: String(err) });
    }
  }

  @SubscribeMessage('card.delete')
  async onCardDelete(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const correlationId = payload?.correlationId;
    const userId = (client as any).user?.sub;
    this.replyToRequester(client, correlationId, { status: 'received' });

    try {
      const result = await this.cardService.handleDeleteCard({ ...payload, correlationId }, userId, client.id);
      if (result.status === 'success') this.replyToRequester(client, correlationId, { status: 'pending' });
      else this.replyToRequester(client, correlationId, { status: 'error', message: result.message || 'lock' });
    } catch (err) {
      this.replyToRequester(client, correlationId, { status: 'error', message: String(err) });
    }
  }

  @SubscribeMessage('card.move')
  async onCardMove(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const correlationId = payload?.correlationId;
    const userId = (client as any).user?.sub;
    this.replyToRequester(client, correlationId, { status: 'received' });
    try {
      const result = await this.cardService.handleMoveCard(
        { ...payload, correlationId },
        userId,
        client.id,
      );
      if (result.status === 'success') this.replyToRequester(client, correlationId, { status: 'pending' });
      else this.replyToRequester(client, correlationId, { status: 'error', message: result.message || 'lock' });
    } catch (err) {
      this.replyToRequester(client, correlationId, { status: 'error', message: String(err) });
    }
  }
  
  @SubscribeMessage('column.create')
  async onColumnCreate(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const correlationId = payload?.correlationId;
    const userId = (client as any).user?.sub;
    this.replyToRequester(client, correlationId, { status: 'received' });

    try {
      await this.columnService.handleCreateColumn(
        { ...payload, ownerId: userId, correlationId },
        client.id,
      );
      this.replyToRequester(client, correlationId, { status: 'pending' });
    } catch (err) {
      this.replyToRequester(client, correlationId, { status: 'error', message: String(err) });
    }
  }

  @SubscribeMessage('column.update')
  async onColumnUpdate(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const correlationId = payload?.correlationId;
    this.replyToRequester(client, correlationId, { status: 'received' });

    try {
      await this.columnService.handleUpdateColumn({ ...payload, correlationId }, client.id);
      this.replyToRequester(client, correlationId, { status: 'pending' });
    } catch (err) {
      this.replyToRequester(client, correlationId, { status: 'error', message: String(err) });
    }
  }

  @SubscribeMessage('column.delete')
  async onColumnDelete(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const correlationId = payload?.correlationId;
    this.replyToRequester(client, correlationId, { status: 'received' });
    try {
      await this.columnService.handleDeleteColumn({ ...payload, correlationId }, client.id);
      this.replyToRequester(client, correlationId, { status: 'pending' });
    } catch (err) {
      this.replyToRequester(client, correlationId, { status: 'error', message: String(err) });
    }
  }
  @SubscribeMessage('board.create')
  async onBoardCreate(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const correlationId = payload?.correlationId;
    const userId = (client as any).user?.sub;
    this.replyToRequester(client, correlationId, { status: 'received' });

    try {
      await this.boardService.handleCreateBoard(
        { ...payload, ownerId: userId, correlationId },
        client.id,
      );
      this.replyToRequester(client, correlationId, { status: 'pending' });
    } catch (err) {
      this.replyToRequester(client, correlationId, { status: 'error', message: String(err) });
    }
  }

  @SubscribeMessage('board.update')
  async onBoardUpdate(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const correlationId = payload?.correlationId;
    this.replyToRequester(client, correlationId, { status: 'received' });
    try {
      await this.boardService.handleUpdateBoard({ ...payload, correlationId }, client.id);
      this.replyToRequester(client, correlationId, { status: 'pending' });
    } catch (err) {
      this.replyToRequester(client, correlationId, { status: 'error', message: String(err) });
    }
  }

  @SubscribeMessage('board.delete')
  async onBoardDelete(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const correlationId = payload?.correlationId;
    this.replyToRequester(client, correlationId, { status: 'received' });
    try {
      await this.boardService.handleDeleteBoard({ ...payload, correlationId }, client.id);
      this.replyToRequester(client, correlationId, { status: 'pending' });
    } catch (err) {
      this.replyToRequester(client, correlationId, { status: 'error', message: String(err) });
    }
  }
  async handleDisconnect(client: Socket) {
    const info = this.userSockets.get(client.id);
    if (!info) return;

    this.userSockets.delete(client.id);
    const clients = this.userIdToClients.get(info.userId);
    clients?.delete(client.id);
    if (!clients || clients.size === 0)
      this.userIdToClients.delete(info.userId);

    await this.lockService.releaseAllLocksForUser(info.userId);
    this.logger.log(
      `❌ Client disconnected: ${client.id} (User: ${info.userId})`,
    );
  }
}
