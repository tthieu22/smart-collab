'use client';

import { io, Socket } from 'socket.io-client';
import { projectStore } from '@smart/store/project';
import { useAuthStore } from '@smart/store/auth';
import { useUserStore } from '@smart/store/user';
import { MoveCopyCardPayload } from '@smart/types/project';

type CorrelationCallback = (msg: any) => void;

interface QueueItem {
  projectId: string;
  resolve: (value?: void | PromiseLike<void>) => void;
  reject: (reason?: any) => void;
  attempt: number;
}

type RealtimeScope = {
  projectId?: string;
  userId?: string;
};

export class ProjectSocketManager {
  private socket: Socket | null = null;
  private initializing = false;
  private joinedProjects = new Set<string>();
  private joinQueue: QueueItem[] = [];
  private isProcessingQueue = false;
  private tokenSubscribed = false;
  private correlationCallbacks = new Map<string, CorrelationCallback[]>();
  private activeProjectId: string | null = null;

  constructor() {
    if (process.env.NODE_ENV === 'development')
      console.log('🟢 ProjectSocketManager initialized');
    this.subscribeToken();
    this.bindActiveProject();
  }

  private activeBound = false;

  private bindActiveProject() {
    if (this.activeBound) return;
    this.activeBound = true;

    let prev: string | null = projectStore.getState().activeProjectId ?? null;
    this.setActiveProject(prev).catch(() => {});

    projectStore.subscribe((state) => {
      const next = state.activeProjectId ?? null;
      if (next === prev) return;
      prev = next;
      this.setActiveProject(next).catch(() => {});
    });
  }

  /** Subscribe token từ auth store */
  private subscribeToken() {
    if (this.tokenSubscribed) return;
    this.tokenSubscribed = true;

    useAuthStore.subscribe((state) => {
      const token = state.accessToken;
      // Nếu token bị xoá => disconnect
      if (!token && this.socket) {
        this.disconnect();
        return;
      }
      // Nếu có token và socket chưa connect hoặc token thay đổi -> reconnect
      if (token) {
        const currentAuthToken = (this.socket?.auth as any)?.token;
        if (
          !this.socket ||
          !this.socket.connected ||
          currentAuthToken !== token
        ) {
          if (this.socket) this.disconnect();
          this.initSocket();
        }
      }
    });
  }

  /** Khởi tạo socket lazy (idempotent, race-safe) */
  initSocket() {
    if (this.socket) return this.socket;
    if (this.initializing) return this.socket;
    this.initializing = true;

    try {
      const authToken = useAuthStore.getState().accessToken;

      this.socket = io('http://localhost:3003', {
        auth: { token: authToken },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        timeout: 5000,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        if (process.env.NODE_ENV === 'development')
          console.log('🟢 Socket connected', this.socket?.id);
        
        // Re-join active project if set
        if (this.activeProjectId) {
          console.log('🔄 Re-joining active project after connect:', this.activeProjectId);
          this.joinProject(this.activeProjectId, { switchProject: true });
        }
        
        // Re-join other rooms
        this.joinAllRooms();
      });

      this.socket.on('disconnect', (reason) => {
        if (process.env.NODE_ENV === 'development')
          console.log('Socket disconnected', reason);
      });
      this.socket.on('connect_error', (err) =>
        console.error('Socket connect_error', err)
      );

      const events = [
        'realtime.project.created',
        'realtime.project.updated',
        'realtime.project.deleted',
        'realtime.project.fetched',
        'realtime.project.listed',
        'realtime.project.member_added',
        'realtime.project.member_removed',
        'realtime.project.member_role_updated',
        'realtime.board.created',
        'realtime.board.updated',
        'realtime.board.deleted',
        'realtime.column.created',
        'realtime.column.updated',
        'realtime.column.deleted',
        'realtime.column.moved',
        'realtime.card.created',
        'realtime.card.updated',
        'realtime.card.deleted',
        'realtime.card.moved',
        'realtime.card.copied',
        'realtime.comment.created',
        'realtime.comment.updated',
        'realtime.comment.deleted',
        'realtime.notification.created',
        'realtime.action.response',
      ];

      events.forEach((event) => {
        this.socket?.on(event, (msg: any) => {
          this.handleStoreUpdate(event, msg);

          // correlationId callbacks
          if (msg?.correlationId) {
            // BE gửi 2 lần cho cùng correlationId: {status:'received'} rồi {status:'success'|'error'}.
            // Nếu gọi callback ngay ở 'received' thì lockAwareAction/waitForResponse sẽ resolve quá sớm.
            if (msg?.status === 'received') return;
            const cbs = this.correlationCallbacks.get(msg.correlationId);
            if (cbs && cbs.length) {
              // call all callbacks (make a copy to avoid mutation issues)
              [...cbs].forEach((cb) => cb(msg));
              // one-time semantics: remove after calling
              this.correlationCallbacks.delete(msg.correlationId);
            }
          }
        });
      });

      return this.socket;
    } finally {
      this.initializing = false;
    }
  }

  /** Subscribe theo correlationId với timeout. Trả về hàm unsubscribe. */
  subscribeCorrelation(
    correlationId: string,
    callback: CorrelationCallback,
    timeout = 5000
  ): () => void {
    if (!this.correlationCallbacks.has(correlationId))
      this.correlationCallbacks.set(correlationId, []);
    this.correlationCallbacks.get(correlationId)!.push(callback);

    let called = false;
    const timer = setTimeout(() => {
      if (called) return;
      called = true;
      const cbs = this.correlationCallbacks.get(correlationId);
      if (!cbs) return;
      // remove this callback from list
      this.correlationCallbacks.set(
        correlationId,
        cbs.filter((cb) => cb !== callback)
      );
      try {
        callback({ status: 'error', message: 'timeout' });
      } catch (e) {
        console.error(e);
      }
    }, timeout);

    return () => {
      if (called) return;
      clearTimeout(timer);
      called = true;
      const cbs = this.correlationCallbacks.get(correlationId);
      if (!cbs) return;
      const remaining = cbs.filter((cb) => cb !== callback);
      if (remaining.length)
        this.correlationCallbacks.set(correlationId, remaining);
      else this.correlationCallbacks.delete(correlationId);
    };
  }

  /** Helper: chờ response theo correlationId và resolve (auto unsubscribe) */
  private waitForResponse(correlationId: string, timeout = 5000): Promise<any> {
    return new Promise((resolve) => {
      const unsub = this.subscribeCorrelation(
        correlationId,
        (msg) => {
          try {
            resolve(msg);
          } finally {
            unsub();
          }
        },
        timeout
      );
    });
  }

  private handleStoreUpdate(event: string, msg: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[REALTIME EVENT] ${event}`, msg);
    }
    const store = projectStore.getState();
    if (event === 'realtime.action.response') {
      // Some handlers on BE already return an envelope {status, correlationId, data}
      // and gateway wraps again, resulting in msg.data.data.
      const payload = msg?.data?.data ?? msg?.data;
      switch (msg.action) {
        case 'card.create':
          if (msg.status === 'success') {
            store.addCard(payload.columnId, payload);
          }
          break;
        case 'card.update':
          if (msg.status === 'success') {
            store.updateCard(payload);
          }
          break;
        case 'card.delete':
          if (msg.status === 'success') {
            store.removeCard(payload.columnId, payload.cardId);
          }
          break;
        case 'card.move':
          if (msg.status === 'success') {
            store.moveCard(
              payload.srcColumnId,
              payload.newColumnId,
              payload.cardId,
              payload.newIndex
            );
          }
          break;
        case 'card.copy':
          if (msg.status === 'success') {
            store.addCard(payload.columnId, payload);
          }
          break;

        case 'column.create':
          if (msg.status === 'success') {
            store.addColumn(payload.boardId, payload);
          }
          break;
        case 'column.update':
          if (msg.status === 'success') {
            store.updateColumn(payload);
          }
          break;
        case 'column.delete':
          if (msg.status === 'success') {
            store.removeColumn(payload.boardId, payload.columnId);
          }
          break;
        case 'column.move':
          if (msg.status === 'success') {
            // backend payload may use destIndex or newPosition depending on service implementation
            const destIndex =
              payload?.destIndex ??
              payload?.newPosition ??
              payload?.position ??
              0;
            store.moveColumn(
              payload.srcBoardId,
              payload.destBoardId ?? payload.newBoardId,
              payload.columnId,
              destIndex
            );
          }
          break;

        case 'board.create':
        case 'board.update':
          if (msg.status === 'success') {
            store.updateBoard(payload);
          }
          break;
        case 'board.delete':
          if (msg.status === 'success') {
            store.removeBoard(payload.boardId);
          }
          break;

        case 'member.add':
          if (msg.status === 'success') {
            store.addMember(payload);
          }
          break;
        case 'member.remove':
          if (msg.status === 'success') {
            store.removeMember(payload.userId);
          }
          break;
        case 'member.role':
          if (msg.status === 'success') {
            store.updateMember(payload);
          }
          break;

        default:
          console.warn(
            `Unhandled action in realtime.action.response: ${msg.action}`,
            msg
          );
          break;
      }
      return;
    }

    // Broadcast events (other users in same project room)
    // These events come as realtime.<entity>.<verb>
    switch (event) {
      case 'realtime.column.moved': {
        // try to support common shapes returned by BE service
        const srcBoardId = msg?.srcBoardId;
        const destBoardId = msg?.destBoardId ?? msg?.newBoardId;
        const columnId = msg?.columnId;
        const destIndex =
          msg?.destIndex ?? msg?.newPosition ?? msg?.position ?? 0;
        if (srcBoardId && destBoardId && columnId != null) {
          store.moveColumn(srcBoardId, destBoardId, columnId, destIndex);
        }
        break;
      }
      case 'realtime.card.moved': {
        const srcColumnId = msg?.srcColumnId;
        const destColumnId = msg?.destColumnId ?? msg?.newColumnId;
        const cardId = msg?.cardId;
        const destIndex = msg?.destIndex ?? msg?.newIndex ?? msg?.position ?? 0;
        if (srcColumnId && destColumnId && cardId != null) {
          store.moveCard(srcColumnId, destColumnId, cardId, destIndex);
        }
        break;
      }
      case 'realtime.card.created': {
        if (msg?.columnId && msg?.id) store.addCard(msg.columnId, msg);
        break;
      }
      case 'realtime.card.updated': {
        if (msg?.id) store.updateCard(msg);
        break;
      }
      case 'realtime.card.deleted': {
        if (msg?.columnId && msg?.cardId)
          store.removeCard(msg.columnId, msg.cardId);
        break;
      }
      case 'realtime.column.created': {
        if (msg?.boardId && msg?.id) store.addColumn(msg.boardId, msg);
        break;
      }
      case 'realtime.column.updated': {
        if (msg?.id) store.updateColumn(msg);
        break;
      }
      case 'realtime.column.deleted': {
        if (msg?.boardId && msg?.columnId)
          store.removeColumn(msg.boardId, msg.columnId);
        break;
      }
      case 'realtime.board.created':
      case 'realtime.board.updated': {
        if (msg?.id) store.updateBoard(msg);
        break;
      }
      case 'realtime.board.deleted': {
        if (msg?.boardId) store.removeBoard(msg.boardId);
        break;
      }
      case 'realtime.project.member_added': {
        if (msg?.id) store.addMember(msg);
        break;
      }
      case 'realtime.project.member_removed': {
        if (msg?.userId) store.removeMember(msg.userId);
        break;
      }
      case 'realtime.project.member_role_updated': {
        if (msg?.id) store.updateMember(msg);
        break;
      }
      case 'realtime.notification.created': {
        const { useUserNotificationStore } = require('./user-notifications');
        useUserNotificationStore.getState().addNotification(msg);
        break;
      }
      case 'realtime.project.updated': {
        if (msg?.id) store.setCurrentProject(msg);
        break;
      }
      default:
        break;
    }
  }

  /** Lock-aware action với backoff (sử dụng waitForResponse để tránh Promise treo) */
  private async lockAwareAction(
    event: string,
    payload: any,
    callback?: (msg: any) => void,
    maxRetry = 5
  ) {
    let attempt = 0;
    let delay = 200;

    while (attempt < maxRetry) {
      const correlationId = this.emitAction(event, payload, callback);
      const res = await this.waitForResponse(correlationId, 5000);

      // Nếu backend trả về lock -> retry
      if (res && res.status === 'error' && res.message === 'lock') {
        attempt++;
        await new Promise((r) => setTimeout(r, delay));
        delay *= 1.5;
        continue;
      }

      return res;
    }

    return { status: 'error', message: 'Failed after retries' };
  }

  private emitAction(
    event: string,
    payload: any,
    correlationCallback?: (msg: any) => void
  ) {
    if (!this.socket) this.initSocket();
    const correlationId = crypto.randomUUID();
    const authUserId = useUserStore.getState().currentUser?.id;
    const scopeProjectId = payload.projectId;
    const scopeUserId = payload.userId ?? authUserId;
    const msg = {
      correlationId,
      projectId: scopeProjectId,
      userId: scopeUserId,
      payload: { ...payload, projectId: undefined, userId: undefined },
    };

    if (correlationCallback) {
      this.subscribeCorrelation(correlationId, correlationCallback);
    }

    this.socket?.emit('realtime.action', { event, data: msg });
    return correlationId;
  }

  // Card
  createCard(
    projectId: string | undefined,
    columnId: string,
    title: string,
    cb?: (msg: any) => void
  ) {
    return this.lockAwareAction(
      'card.create',
      { projectId, payload: { columnId, title } },
      cb
    );
  }
  moveCard(
    scope: RealtimeScope,
    payload: MoveCopyCardPayload,
    cb?: (msg: any) => void
  ) {
    return this.lockAwareAction('card.move', { projectId: scope.projectId, userId: scope.userId, payload }, cb);
  }
  copyCard(
    scope: RealtimeScope,
    payload: MoveCopyCardPayload,
    cb?: (msg: any) => void
  ) {
    return this.lockAwareAction('card.copy', { projectId: scope.projectId, userId: scope.userId, payload }, cb);
  }
  updateCard(
    projectId: string | undefined,
    cardId: string,
    action: string,
    data: any,
    updatedById?: string,
    cb?: (msg: any) => void
  ) {
    return this.lockAwareAction(
      'card.update',
      { projectId, userId: updatedById, payload: { cardId, action, data, updatedById } },
      cb
    );
  }
  deleteCard(projectId: string, cardId: string, cb?: (msg: any) => void) {
    return this.lockAwareAction(
      'card.delete',
      { projectId, payload: { cardId } },
      cb
    );
  }

  // Column
  createColumn(
    boardId: string,
    title: string,
    projectId: string,
    cb?: (msg: any) => void
  ) {
    return this.lockAwareAction(
      'column.create',
      { projectId, payload: { boardId, title } },
      cb
    );
  }
  updateColumn(
    projectId: string,
    columnId: string,
    updates: any,
    cb?: (msg: any) => void
  ) {
    return this.lockAwareAction(
      'column.update',
      { projectId, payload: { columnId, ...updates } },
      cb
    );
  }
  deleteColumn(projectId: string, columnId: string, cb?: (msg: any) => void) {
    return this.lockAwareAction(
      'column.delete',
      { projectId, payload: { columnId } },
      cb
    );
  }
  moveColumn(
    projectId: string,
    srcBoardId: string,
    destBoardId: string,
    columnId: string,
    destIndex: number,
    cb?: (msg: any) => void
  ) {
    return this.lockAwareAction(
      'column.move',
      { projectId, payload: { srcBoardId, destBoardId, columnId, destIndex } },
      cb
    );
  }

  getColumns(
    projectId: string,
    options?: { boardId?: string },
    cb?: (msg: any) => void
  ) {
    return this.lockAwareAction(
      'column.get',
      { projectId, payload: { boardId: options?.boardId } },
      cb
    );
  }

  getCards(
    projectId: string,
    options?: { columnId?: string },
    cb?: (msg: any) => void
  ) {
    return this.lockAwareAction(
      'card.get',
      { projectId, payload: { columnId: options?.columnId } },
      cb
    );
  }

  // Board
  createBoard(projectId: string, name: string, cb?: (msg: any) => void) {
    return this.lockAwareAction(
      'board.create',
      { projectId, payload: { name } },
      cb
    );
  }
  updateBoard(
    projectId: string,
    boardId: string,
    updates: any,
    cb?: (msg: any) => void
  ) {
    return this.lockAwareAction(
      'board.update',
      { projectId, payload: { boardId, ...updates } },
      cb
    );
  }
  deleteBoard(projectId: string, boardId: string, cb?: (msg: any) => void) {
    return this.lockAwareAction(
      'board.delete',
      { projectId, payload: { boardId } },
      cb
    );
  }

  /** Queue join room từng project, retry */
  async joinProject(projectId: string, opts?: { switchProject?: boolean }) {
    if (this.joinedProjects.has(projectId)) return Promise.resolve();
    if (!this.socket) this.initSocket();

    return new Promise<void>((resolve, reject) => {
      (this.joinQueue as any).push({
        projectId,
        resolve,
        reject,
        attempt: 0,
        opts,
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.joinQueue.length) {
      const item = this.joinQueue.shift()!;
      if (this.joinedProjects.has(item.projectId)) {
        item.resolve();
        continue;
      }
      try {
        await this._attemptJoin(item as any);
      } catch (err) {
        console.warn('Join project failed:', item.projectId, err);
        item.reject(err);
      }
    }

    this.isProcessingQueue = false;
  }

  private _attemptJoin(
    item: QueueItem & { opts?: { switchProject?: boolean } }
  ) {
    return new Promise<void>((resolve, reject) => {
      if (!this.socket) this.initSocket();
      if (!this.socket) return reject('Socket not initialized');

      const tryJoin = () => {
        this.socket?.emit(
          'joinProject',
          {
            projectId: item.projectId,
            switchProject: Boolean(item.opts?.switchProject),
          },
          (ack: boolean) => {
            if (ack) {
              this.joinedProjects.add(item.projectId);
              console.log(`✅ Joined project ${item.projectId}`);
              resolve();
            } else {
              item.attempt++;
              if (item.attempt < 5) {
                console.warn(
                  `Retry join ${item.projectId}, attempt ${item.attempt}`
                );
                setTimeout(tryJoin, 200 * item.attempt);
              } else {
                reject(`Failed to join ${item.projectId} after retries`);
              }
            }
          }
        );
      };

      // Đảm bảo socket connect trước khi join
      if (this.socket.connected) {
        tryJoin();
      } else {
        console.log(
          '⏳ Waiting for socket to connect before joining',
          item.projectId
        );
        this.onceConnected(tryJoin);
      }
    });
  }

  leaveProject(projectId: string) {
    if (!this.socket) return;

    // If user navigates away quickly, join ack may not have arrived yet.
    // Always attempt to leave on server, and also prevent future re-join.
    this.joinedProjects.delete(projectId);
    this.joinQueue = this.joinQueue.filter((q) => q.projectId !== projectId);

    try {
      this.socket.emit('leaveProject', { projectId }, (ack: boolean) => {
        if (!ack) console.warn('Failed to leave project', projectId);
      });
    } catch (e) {
      console.warn('leaveProject emit failed', e);
    }
  }

  /**
   * Single source of truth for "current viewing project".
   * Call this on entering/leaving `/projects/:id` to guarantee leave.
   */
  async setActiveProject(projectId: string | null) {
    if (projectId === this.activeProjectId) return;

    const prev = this.activeProjectId;
    this.activeProjectId = projectId;

    if (prev) {
      this.leaveProject(prev);
    }

    if (projectId) {
      await this.joinProject(projectId, { switchProject: true });
    }
  }

  /** Re-join rooms on connect: snapshot and re-queue */
  private joinAllRooms() {
    const joined = Array.from(this.joinedProjects);
    // clear set so joinProject will actually enqueue join actions
    this.joinedProjects.clear();
    joined.forEach((pid, i) => {
      setTimeout(() => this.joinProject(pid), 200 * i);
    });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.joinedProjects.clear();
    this.correlationCallbacks.clear();
    this.joinQueue = [];
  }

  isConnected() {
    return Boolean(this.socket?.connected);
  }
  onceConnected(callback: () => void) {
    if (!this.socket) this.initSocket();
    if (this.socket?.connected) return callback();
    this.socket?.once('connect', callback);
  }
}

// Singleton Next.js safe
declare global {
  var _projectSocketManager: ProjectSocketManager | undefined;
}

export function getProjectSocketManager() {
  if (!globalThis._projectSocketManager) {
    globalThis._projectSocketManager = new ProjectSocketManager();
  }
  return globalThis._projectSocketManager;
}
