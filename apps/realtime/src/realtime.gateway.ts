// src/realtime/gateway/realtime.gateway.ts
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
import { BoardService } from './services/project/board.service';
import { ColumnService } from './services/project/column.service';
import { CardService } from './services/project/card.service';
import { MemberService } from './services/project/member.service';

type Handler = (data: any, userId: string, client: Socket) => Promise<any>;

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger('RealtimeGateway');

  private userSockets = new Map<string, string>();
  private userClients = new Map<string, Set<string>>();
  private projectUsers = new Map<string, Set<string>>();

  private handlers = new Map<string, Handler>([
    ['card.create', async (d, u, client) => {
      const result = await this.card.createCard(d, u);
      this.emitRealtime(d.projectId, 'card.created', result, client.id);
      return result;
    }],

    ['card.update', async (d, u, client) => {
      const result = await this.card.updateCard(d);
      this.emitRealtime(d.projectId, 'card.updated', result, client.id);
      return result;
    }],

    ['card.delete', async (d, u, client) => {
      const result = await this.card.deleteCard(d, u);
      this.emitRealtime(d.projectId, 'card.deleted', { columnId: d.columnId, cardId: d.cardId }, client.id);
      return result;
    }],

    ['card.move', async (d, u, client) => {
      const result = await this.card.moveCard(d, u);
      this.emitRealtime(d.projectId, 'card.moved', result, client.id);
      return result;
    }],

    ['card.copy', async (d, u, client) => {
      const result = await this.card.copyCard(d, u);
      this.emitRealtime(d.projectId, 'card.copied', result, client.id);
      return result;
    }],

    ['column.create', async (d, u, client) => {
      const result = await this.column.createColumn(d, u);
      this.emitRealtime(d.projectId, 'column.created', result, client.id);
      return result;
    }],

    ['column.update', async (d, u, client) => {
      const result = await this.column.updateColumn(d);
      this.emitRealtime(d.projectId, 'column.updated', result, client.id);
      return result;
    }],

    ['column.delete', async (d, u, client) => {
      const result = await this.column.deleteColumn(d, u);
      this.emitRealtime(d.projectId, 'column.deleted', { boardId: d.boardId, columnId: d.columnId }, client.id);
      return result;
    }],

    ['column.move', async (d, u, client) => {
      const result = await this.column.moveColumn(d, u);
      this.emitRealtime(d.projectId, 'column.moved', result, client.id);
      return result;
    }],

    ['board.create', async (d, u, client) => {
      const result = await this.board.createBoard(d, u);
      this.emitRealtime(d.projectId, 'board.created', result, client.id);
      return result;
    }],

    ['board.update', async (d, u, client) => {
      const result = await this.board.updateBoard(d);
      this.emitRealtime(d.projectId, 'board.updated', result, client.id);
      return result;
    }],

    ['board.delete', async (d, u, client) => {
      const result = await this.board.deleteBoard(d, u);
      this.emitRealtime(d.projectId, 'board.deleted', { boardId: d.boardId }, client.id);
      return result;
    }],

    ['board.get', async (d, u, client) => {
      const result = await this.board.getBoards(d);
      return result;
    }],

    ['member.add', async (d, u, client) => {
      const result = await this.member.addMember(d, u);
      this.emitRealtime(d.projectId, 'project.member_added', result, client.id);
      return result;
    }],

    ['member.remove', async (d, u, client) => {
      const result = await this.member.removeMember(d, u);
      this.emitRealtime(d.projectId, 'project.member_removed', { userId: d.userId }, client.id);
      return result;
    }],

    ['member.role', async (d, u, client) => {
      const result = await this.member.updateMemberRole(d, u);
      this.emitRealtime(d.projectId, 'project.member_role_updated', result, client.id);
      return result;
    }],
  ]);

  constructor(
    private readonly jwt: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly lock: LockService,
    private readonly board: BoardService,
    private readonly column: ColumnService,
    private readonly card: CardService,
    private readonly member: MemberService,
  ) {}

  afterInit() {
    this.server.adapter(createAdapter(this.redis.duplicate(), this.redis.duplicate()));
    this.logger.log('WebSocket READY – Clean Result Only');
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) return client.disconnect();

    try {
      const { sub: userId, projectIds = [] } = this.jwt.verify(token);
      (client as any).userId = userId;

      this.userSockets.set(client.id, userId);
      if (!this.userClients.has(userId)) this.userClients.set(userId, new Set());
      this.userClients.get(userId)!.add(client.id);

      (projectIds as string[]).forEach((pid) => {
        client.join(pid);
        this.addUserToProject(pid, userId);
      });

      this.logger.log(`User ${userId} connected (${client.id})`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.userSockets.get(client.id);
    if (!userId) return;

    this.userSockets.delete(client.id);
    const set = this.userClients.get(userId);
    set?.delete(client.id);
    if (set?.size === 0) this.userClients.delete(userId);

    await this.lock.releaseAllLocksForUser(userId);

    for (const [projectId, users] of this.projectUsers.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        if (users.size === 0) this.projectUsers.delete(projectId);
        this.broadcastOnline(projectId);
      }
    }

    this.logger.log(`User ${userId} disconnected`);
  }

  private addUserToProject(projectId: string, userId: string) {
    if (!this.projectUsers.has(projectId)) {
      this.projectUsers.set(projectId, new Set());
    }
    this.projectUsers.get(projectId)!.add(userId);
    this.broadcastOnline(projectId);
  }

  private broadcastOnline(projectId: string) {
    const users = this.projectUsers.get(projectId);
    const online = users ? users.size : 0;
    const userIds = users ? Array.from(users) : [];

    this.emitToProject(projectId, 'realtime.project.online', {
      projectId,
      online,
      users: userIds,
    });
  }

  private reply(c: Socket, id: string | undefined, data: any) {
    c.emit('realtime.action.response', { correlationId: id, ...data });
  }

  private emitToProject = (
    projectId: string,
    event: string,
    data: any,
    excludeClientId?: string,
  ) => {
    if (excludeClientId) {
      this.server.to(projectId).except(excludeClientId).emit(event, data);
    } else {
      this.server.to(projectId).emit(event, data);
    }
  };

  private emitToUser = (userId: string, event: string, data: any) => {
    this.userClients.get(userId)?.forEach((clientId) => {
      this.server.to(clientId).emit(event, data);
    });
  };

  private emitRealtime(projectId: string, event: string, data: any, excludeClientId?: string) {
    this.emitToProject(projectId, `realtime.${event}`, data, excludeClientId);
  }

  @SubscribeMessage('realtime.action')
  async handleAny(
    @ConnectedSocket() client: Socket,
    @MessageBody() { event, data }: { event: string; data: any },
  ) {
    const { projectId, correlationId, payload } = data || {};
    const userId = (client as any).userId;

    if (!event || !this.handlers.has(event)) {
      return this.reply(client, correlationId, { status: 'error', message: 'Unknown event' });
    }

    this.reply(client, correlationId, { status: 'received' });

    try {
      const handler = this.handlers.get(event)!;

      const result = await handler(
        { projectId, correlationId, ...payload },
        userId,
        client,
      );

      this.reply(client, correlationId, result);
    } catch (err: any) {
      this.reply(client, correlationId, {
        status: 'error',
        message: err.message || 'Server error',
      });
    }
  }
  
  @SubscribeMessage('joinProject')
  async joinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string, // ← NHẬN STRING TRỰC TIẾP
    ack?: (success: boolean) => void,
  ) {
    const userId = (client as any).userId;

    if (!projectId || !userId) {
      return ack?.(false);
    }

    // (Tùy chọn) Kiểm tra quyền
    // const isMember = await this.member.isMember(projectId, userId);
    // if (!isMember) return ack?.(false);

    client.join(projectId);
    this.addUserToProject(projectId, userId);

    ack?.(true);
    this.logger.log(`User ${userId} joined project: ${projectId}`);
  }

  @SubscribeMessage('leaveProject')
  leave(@ConnectedSocket() c: Socket, @MessageBody() { projectId }: any) {
    c.leave(projectId);
    const userId = (c as any).userId;
    const users = this.projectUsers.get(projectId);
    if (users?.has(userId)) {
      users.delete(userId);
      if (users.size === 0) this.projectUsers.delete(projectId);
      this.broadcastOnline(projectId);
    }
  }

  @SubscribeMessage('project.getOnline')
  getOnline(@ConnectedSocket() c: Socket, @MessageBody() { projectId }: any) {
    const users = this.projectUsers.get(projectId);
    const online = users ? users.size : 0;
    const userIds = users ? Array.from(users) : [];

    this.reply(c, undefined, {
      projectId,
      online,
      users: userIds,
    });
  }
}