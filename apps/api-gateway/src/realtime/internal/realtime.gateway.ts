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
import { LockService } from './services/lock.service';
import { BoardService } from './services/project/board.service';
import { ColumnService } from './services/project/column.service';
import { CardService } from './services/project/card.service';
import { MemberService } from './services/project/member.service';
import { MeetingService } from './services/project/meeting.service';

type Handler = (data: any, userId: string, client: Socket) => Promise<any>;
type RealtimeTarget = { projectId?: string; userId?: string };

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger('RealtimeGateway');

  private userSockets = new Map<string, string>();
  private userClients = new Map<string, Set<string>>();
  private projectUsers = new Map<string, Set<string>>();

  private roomForProject(projectId: string) {
    return `project:${projectId}`;
  }

  private handlers = new Map<string, Handler>([
    [
      'card.create',
      async (d, u, client) => {
        const result = await this.card.createCard(d, u);
        this.emitRealtime({ projectId: d.projectId, userId: d.userId ?? u }, 'card.created', result, client.id);
        return { status: 'success', data: result };
      },
    ],

    [
      'card.update',
      async (d, u, client) => {
        const result = await this.card.updateCard(d);
        this.emitRealtime({ projectId: d.projectId, userId: d.userId ?? u }, 'card.updated', result, client.id);
        return { status: 'success', data: result };
      },
    ],

    [
      'card.delete',
      async (d, u, client) => {
        const result = await this.card.deleteCard(d, u);
        this.emitRealtime(
          { projectId: d.projectId, userId: d.userId ?? u },
          'card.deleted',
          { columnId: d.columnId, cardId: d.cardId },
          client.id,
        );
        return {
          status: 'success',
          data: { columnId: d.columnId, cardId: d.cardId },
          result,
        };
      },
    ],

    [
      'card.move',
      async (d, u, client) => {
        const result = await this.card.moveCard(d, u);
        this.emitRealtime({ projectId: d.projectId, userId: d.userId ?? u }, 'card.moved', result, client.id);
        return { status: 'success', data: result };
      },
    ],

    [
      'card.copy',
      async (d, u, client) => {
        const result = await this.card.copyCard(d, u);
        this.emitRealtime({ projectId: d.projectId, userId: d.userId ?? u }, 'card.copied', result, client.id);
        return { status: 'success', data: result };
      },
    ],

    [
      'column.get',
      async (d) => {
        const result = await this.column.getColumns({
          projectId: d.projectId,
          boardId: d.payload?.boardId,
        });
        return {
          status: 'success',
          data: result?.data ?? result,
        };
      },
    ],
    [
      'card.get',
      async (d) => {
        const result = await this.card.getCards({
          projectId: d.projectId,
          columnId: d.payload?.columnId,
        });
        return {
          status: 'success',
          data: result?.data ?? result,
        };
      },
    ],

    [
      'column.create',
      async (d, u, client) => {
        const result = await this.column.createColumn(d, u);
        this.emitRealtime({ projectId: d.projectId, userId: d.userId ?? u }, 'column.created', result, client.id);
        return { status: 'success', data: result };
      },
    ],

    [
      'column.update',
      async (d, u, client) => {
        const result = await this.column.updateColumn(d);
        this.emitRealtime({ projectId: d.projectId, userId: d.userId ?? u }, 'column.updated', result, client.id);
        return { status: 'success', data: result };
      },
    ],

    [
      'column.delete',
      async (d, u, client) => {
        const result = await this.column.deleteColumn(d, u);
        this.emitRealtime(
          { projectId: d.projectId, userId: d.userId ?? u },
          'column.deleted',
          { boardId: d.boardId, columnId: d.columnId },
          client.id,
        );
        return {
          status: 'success',
          data: { boardId: d.boardId, columnId: d.columnId },
          result,
        };
      },
    ],

    [
      'column.move',
      async (d, u, client) => {
        const result = await this.column.moveColumn(d, u);
        this.emitRealtime({ projectId: d.projectId, userId: d.userId ?? u }, 'column.moved', result, client.id);
        return { status: 'success', data: result };
      },
    ],

    [
      'board.create',
      async (d, u, client) => {
        const result = await this.board.createBoard(d, u);
        this.emitRealtime({ projectId: d.projectId, userId: d.ownerId ?? d.userId ?? u }, 'board.created', result, client.id);
        return { status: 'success', data: result };
      },
    ],

    [
      'board.update',
      async (d, u, client) => {
        const result = await this.board.updateBoard(d);
        this.emitRealtime({ projectId: d.projectId, userId: d.userId ?? u }, 'board.updated', result, client.id);
        return { status: 'success', data: result };
      },
    ],

    [
      'board.delete',
      async (d, u, client) => {
        const result = await this.board.deleteBoard(d, u);
        this.emitRealtime(
          { projectId: d.projectId, userId: d.userId ?? u },
          'board.deleted',
          { boardId: d.boardId },
          client.id,
        );
        return { status: 'success', data: { boardId: d.boardId }, result };
      },
    ],

    [
      'board.get',
      async (d, u, client) => {
        const result = await this.board.getBoards(d);
        return { status: 'success', data: result };
      },
    ],

    [
      'member.add',
      async (d, u, client) => {
        const result = await this.member.addMember(d, u);
        this.emitRealtime(
          d.projectId,
          'project.member_added',
          result,
          client.id,
        );
        return { status: 'success', data: result };
      },
    ],

    [
      'member.remove',
      async (d, u, client) => {
        const result = await this.member.removeMember(d, u);
        this.emitRealtime(
          d.projectId,
          'project.member_removed',
          { userId: d.userId },
          client.id,
        );
        return { status: 'success', data: { userId: d.userId }, result };
      },
    ],

    [
      'member.role',
      async (d, u, client) => {
        const result = await this.member.updateMemberRole(d, u);
        this.emitRealtime(
          d.projectId,
          'project.member_role_updated',
          result,
          client.id,
        );
        return { status: 'success', data: result };
      },
    ],
    [
      'project.meeting.create',
      async (d, u, client) => {
        const result = await this.meeting.createMeeting(d, u);
        return result;
      },
    ],
  ]);

  constructor(
    private readonly jwt: JwtService,
    private readonly lock: LockService,
    private readonly board: BoardService,
    private readonly column: ColumnService,
    private readonly card: CardService,
    private readonly member: MemberService,
    private readonly meeting: MeetingService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket READY – Monolith In-Process');
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const { sub: userId, projectIds = [] } = this.jwt.verify(token);
        (client as any).userId = userId;
        (client as any).currentProjectId = undefined;

        this.userSockets.set(client.id, userId);
        if (!this.userClients.has(userId))
          this.userClients.set(userId, new Set());
        this.userClients.get(userId)!.add(client.id);

        (projectIds as string[]).forEach((pid) => {
          client.join(this.roomForProject(pid));
          this.addUserToProject(pid, userId);
        });

        this.logger.log(`User ${userId} connected (${client.id})`);
      } catch (err) {
        this.logger.warn(`Invalid token for connection ${client.id}: ${err}`);
        this.logger.log(`Connection ${client.id} continuing as guest due to invalid token`);
      }
    } else {
      this.logger.log(`Guest connected (${client.id})`);
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

  public emitToProject = (
    projectId: string,
    event: string,
    data: any,
    _excludeClientId?: string,
  ) => {
    const room = this.roomForProject(projectId);
    
    // Diagnostic: Count clients in room
    const clients = this.server.sockets.adapter.rooms.get(room);
    const clientCount = clients ? clients.size : 0;
    
    this.logger.debug(`[BROADCAST] Room ${room} (${clientCount} clients) → Event: ${event}`);
    this.server.to(room).emit(event, data);
  };

  public emitToUser = (userId: string, event: string, data: any) => {
    this.userClients.get(userId)?.forEach((clientId) => {
      this.server.to(clientId).emit(event, data);
    });
  };

  private emitRealtime(
    target: RealtimeTarget | string,
    event: string,
    data: any,
    excludeClientId?: string,
  ) {
    // 🎁 Tự động bóc tách dữ liệu nếu là object kết quả { status, data } hoặc { success, data }
    const actualData = data?.data ?? data;

    const projectId = typeof target === 'string' ? target : target.projectId;
    const userId = typeof target === 'string' ? undefined : target.userId;

    if (projectId) {
      this.emitToProject(projectId, `realtime.${event}`, actualData, excludeClientId);
      return;
    }

    if (userId) {
      this.emitToUser(userId, `realtime.${event}`, actualData);
    }
  }

  @SubscribeMessage('realtime.action')
  async handleAny(
    @ConnectedSocket() client: Socket,
    @MessageBody() { event, data }: { event: string; data: any },
  ) {
    const { projectId, correlationId, payload } = data || {};
    const userId = (client as any).userId;

    if (!event || !this.handlers.has(event)) {
      return this.reply(client, correlationId, {
        status: 'error',
        message: 'Unknown event',
      });
    }

    this.reply(client, correlationId, { status: 'received', action: event });

    try {
      const handler = this.handlers.get(event)!;

      const result = await handler(
        { projectId, correlationId, ...payload },
        userId,
        client,
      );

      // Enforce consistent response envelope for FE:
      // { correlationId, action, status, data?, message? }
      const status = result?.status ?? 'success';
      const dataOut = result?.data ?? result;
      this.reply(client, correlationId, {
        action: event,
        status,
        data: dataOut,
      });
    } catch (err: any) {
      this.reply(client, correlationId, {
        status: 'error',
        message: err.message || 'Server error',
        action: event,
      });
    }
  }

  @SubscribeMessage('joinProject')
  async joinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ): Promise<boolean> {
    const userId = (client as any).userId;
    const projectId = typeof body === 'string' ? body : body?.projectId;
    const switchProject = Boolean(
      typeof body === 'object' && body?.switchProject,
    );

    if (!projectId) {
      return false;
    }

    // (Tùy chọn) Kiểm tra quyền
    // const isMember = await this.member.isMember(projectId, userId);
    // if (!isMember) return ack?.(false);

    // Optional "switch": leave previous current project room for this socket
    if (switchProject) {
      const prev = (client as any).currentProjectId as string | undefined;
      if (prev && prev !== projectId) {
        client.leave(this.roomForProject(prev));
        this.logger.debug(`Socket ${client.id} left previous project: ${prev}`);
      }
      (client as any).currentProjectId = projectId;
    }

    const room = this.roomForProject(projectId);
    client.join(room);
    
    // Diagnostic: Verify room membership
    this.logger.debug(`Socket ${client.id} joined ${room}. Current rooms: ${Array.from(client.rooms).join(', ')}`);
    
    if (userId) {
      this.addUserToProject(projectId, userId);
    }

    this.logger.log(`${userId ? `User ${userId}` : `Guest (${client.id})`} joined project room: ${room}`);
    return true;
  }

  @SubscribeMessage('leaveProject')
  leave(@ConnectedSocket() c: Socket, @MessageBody() body: any): boolean {
    const projectId = typeof body === 'string' ? body : body?.projectId;
    if (!projectId) return false;

    c.leave(this.roomForProject(projectId));
    const userId = (c as any).userId;
    const users = this.projectUsers.get(projectId);
    if (users?.has(userId)) {
      users.delete(userId);
      if (users.size === 0) this.projectUsers.delete(projectId);
      this.broadcastOnline(projectId);
    }

    const cur = (c as any).currentProjectId as string | undefined;
    if (cur === projectId) (c as any).currentProjectId = undefined;
    this.logger.log(`User ${userId} left project: ${projectId}`);
    return true;
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
