"use client";

import { io, Socket } from "socket.io-client";
import { projectStore } from "@smart/store/project";
import { useAuthStore } from "@smart/store/auth";

type CorrelationCallback = (msg: any) => void;

interface QueueItem {
  projectId: string;
  resolve: (value?: void | PromiseLike<void>) => void;
  reject: (reason?: any) => void;
  attempt: number;
}

export class ProjectSocketManager {
  private socket: Socket | null = null;
  private initializing = false;
  private joinedProjects = new Set<string>();
  private joinQueue: QueueItem[] = [];
  private isProcessingQueue = false;
  private tokenSubscribed = false;
  private correlationCallbacks = new Map<string, CorrelationCallback[]>();

  constructor() {
    if (process.env.NODE_ENV === "development") console.log("🟢 ProjectSocketManager initialized");
    this.subscribeToken();
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
        if (!this.socket || !this.socket.connected || currentAuthToken !== token) {
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

      this.socket = io("http://localhost:3003", {
        auth: { token: authToken },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        timeout: 5000,
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        if (process.env.NODE_ENV === "development") console.log("Socket connected", this.socket?.id);
        // Rejoin rooms that were previously joined
        this.joinAllRooms();
      });

      this.socket.on("disconnect", (reason) => {
        if (process.env.NODE_ENV === "development") console.log("Socket disconnected", reason);
      });
      this.socket.on("connect_error", (err) => console.error("Socket connect_error", err));

      const events = [
        "realtime.project.created",
        "realtime.project.updated",
        "realtime.project.deleted",
        "realtime.project.fetched",
        "realtime.project.listed",
        "realtime.project.member_added",
        "realtime.project.member_removed",
        "realtime.project.member_role_updated",
        "realtime.board.created",
        "realtime.board.updated",
        "realtime.board.deleted",
        "realtime.column.created",
        "realtime.column.updated",
        "realtime.column.deleted",
        "realtime.column.moved",
        "realtime.card.created",
        "realtime.card.updated",
        "realtime.card.deleted",
        "realtime.card.moved",
        "realtime.card.copied",
        "realtime.comment.created",
        "realtime.comment.updated",
        "realtime.comment.deleted",
        "realtime.action.response",
      ];

      events.forEach((event) => {
        this.socket?.on(event, (msg: any) => {
          this.handleStoreUpdate(event, msg);

          // correlationId callbacks
          if (msg?.correlationId) {
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
  subscribeCorrelation(correlationId: string, callback: CorrelationCallback, timeout = 5000): () => void {
    if (!this.correlationCallbacks.has(correlationId)) this.correlationCallbacks.set(correlationId, []);
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
        callback({ status: "error", message: "timeout" });
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
      if (remaining.length) this.correlationCallbacks.set(correlationId, remaining);
      else this.correlationCallbacks.delete(correlationId);
    };
  }

  /** Helper: chờ response theo correlationId và resolve (auto unsubscribe) */
  private waitForResponse(correlationId: string, timeout = 5000): Promise<any> {
    return new Promise((resolve) => {
      const unsub = this.subscribeCorrelation(correlationId, (msg) => {
        try {
          resolve(msg);
        } finally {
          unsub();
        }
      }, timeout);
    });
  }

  private handleStoreUpdate(event: string, msg: any) {
    const store = projectStore.getState();
    switch (event) {
      // ---------------- Project ----------------
      case "realtime.project.created":
        store.addProject(msg.project);
        store.setCurrentProject(msg.project);
        break;
      case "realtime.project.updated":
        store.updateProject(msg.project);
        break;
      case "realtime.project.deleted":
        store.removeProject(msg.projectId);
        break;
      case "realtime.project.listed":
        if (Array.isArray(msg.projects)) msg.projects.forEach(store.addProject);
        break;
      case "realtime.project.member_added":
        store.addMember(msg.member);
        break;
      case "realtime.project.member_removed":
        store.removeMember(msg.userId);
        break;
      case "realtime.project.member_role_updated":
        store.updateMember(msg.member);
        break;

      // ---------------- Board ----------------
      case "realtime.board.created":
      case "realtime.board.updated":
        store.updateBoard(msg.board);
        break;
      case "realtime.board.deleted":
        store.removeBoard(msg.boardId);
        break;

      // ---------------- Column ----------------
      case "realtime.column.created":
        store.addColumn(msg.boardId, msg.column);
        break;
      case "realtime.column.updated":
        store.updateColumn(msg.column);
        break;
      case "realtime.column.deleted":
        store.removeColumn(msg.boardId, msg.columnId);
        break;
      case "realtime.column.moved":
        store.moveColumn(msg.srcBoardId, msg.destBoardId, msg.columnId, msg.destIndex);
        break;

      // ---------------- Card ----------------
      case "realtime.card.created":
        if (process.env.NODE_ENV === "development") console.log("Realtime card created:", msg.card?.columnId, msg.card);
        store.addCard(msg.card.columnId, msg.card);
        break;
      case "realtime.card.updated":
        store.updateCard(msg.card);
        break;
      case "realtime.card.deleted":
        store.removeCard(msg.columnId, msg.cardId);
        break;
      case "realtime.card.moved":
        store.moveCard(msg.srcColumnId, msg.cardId, msg.newColumnId, msg.newIndex);
        break;
      case "realtime.card.copied":
        store.addCard(msg.card.columnId, msg.card.title);
        break;

      default:
        console.warn(`Unhandled realtime event: ${event}`, msg);
        break;
    }
  }

  /** Lock-aware action với backoff (sử dụng waitForResponse để tránh Promise treo) */
  private async lockAwareAction(event: string, payload: any, callback?: (msg: any) => void, maxRetry = 5) {
    let attempt = 0;
    let delay = 200;

    while (attempt < maxRetry) {
      const correlationId = this.emitAction(event, payload, callback);
      const res = await this.waitForResponse(correlationId, 5000);

      // Nếu backend trả về lock -> retry
      if (res && res.status === "error" && res.message === "lock") {
        attempt++;
        await new Promise((r) => setTimeout(r, delay));
        delay *= 1.5;
        continue;
      }

      return res;
    }

    return { status: "error", message: "Failed after retries" };
  }

  private emitAction(event: string, payload: any, correlationCallback?: (msg: any) => void) {
    if (!this.socket) this.initSocket();
    const correlationId = crypto.randomUUID();
    const msg = { ...payload, correlationId };
    if (correlationCallback) {
      // subscribe without waiting here (caller may also wait via waitForResponse)
      const unsub = this.subscribeCorrelation(correlationId, correlationCallback);
      // auto-unsub after callback fires is handled by subscribeCorrelation's timeout or manual unsub
      // we don't call unsub here because caller expects callback to be alive for response
    }
    this.socket?.emit(event, msg);
    return correlationId;
  }

  // -------------------------- CRUD examples --------------------------
  createCard(projectId: string, columnId: string, title: string, cb?: (msg: any) => void) {
    if (process.env.NODE_ENV === "development") console.log("createCard", projectId, columnId, title);
    return this.lockAwareAction("card.create", { projectId, columnId, title }, cb);
  }
  moveCard(projectId: string, cardId: string, newColumnId: string, newIndex: number, cb?: (msg: any) => void) {
    return this.lockAwareAction("card.move", { projectId, cardId, newColumnId, newIndex }, cb);
  }
  copyCard(projectId: string, cardId: string, cb?: (msg: any) => void) {
    return this.lockAwareAction("card.copy", { projectId, cardId }, cb);
  }
  deleteCard(projectId: string, cardId: string, cb?: (msg: any) => void) {
    return this.lockAwareAction("card.delete", { projectId, cardId }, cb);
  }

  createColumn(boardId: string, title: string, projectId: string, cb?: (msg: any) => void) {
    return this.lockAwareAction("column.create", { boardId, title, projectId }, cb);
  }
  updateColumn(projectId: string, columnId: string, updates: any, cb?: (msg: any) => void) {
    return this.lockAwareAction("column.update", { projectId, columnId, ...updates }, cb);
  }
  deleteColumn(projectId: string, columnId: string, cb?: (msg: any) => void) {
    return this.lockAwareAction("column.delete", { projectId, columnId }, cb);
  }

  moveColumn(projectId: string, srcBoardId: string, destBoardId: string, columnId: string, destIndex: number, cb?: (msg: any) => void) {
    return this.lockAwareAction("column.move", { projectId, srcBoardId, destBoardId, columnId, destIndex }, cb);
  }

  createBoard(projectId: string, name: string, cb?: (msg: any) => void) {
    return this.lockAwareAction("board.create", { projectId, name }, cb);
  }
  updateBoard(projectId: string, boardId: string, updates: any, cb?: (msg: any) => void) {
    return this.lockAwareAction("board.update", { projectId, boardId, ...updates }, cb);
  }
  deleteBoard(projectId: string, boardId: string, cb?: (msg: any) => void) {
    return this.lockAwareAction("board.delete", { projectId, boardId }, cb);
  }

  /** Queue join room từng project, retry */
  async joinProject(projectId: string) {
    if (this.joinedProjects.has(projectId)) return Promise.resolve();
    if (!this.socket) this.initSocket();

    return new Promise<void>((resolve, reject) => {
      this.joinQueue.push({ projectId, resolve, reject, attempt: 0 });
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
        await this._attemptJoin(item);
      } catch (err) {
        console.warn("Join project failed:", item.projectId, err);
        item.reject(err);
      }
    }

    this.isProcessingQueue = false;
  }

  private _attemptJoin(item: QueueItem) {
    return new Promise<void>((resolve, reject) => {
      if (!this.socket) this.initSocket();
      if (!this.socket) return reject("Socket not initialized");

      const tryJoin = () => {
        this.socket?.emit("joinProject", item.projectId, (ack: boolean) => {
          if (ack) {
            this.joinedProjects.add(item.projectId);
            if (process.env.NODE_ENV === "development") console.log(`✅ Joined project ${item.projectId}`);
            resolve();
          } else {
            item.attempt++;
            if (item.attempt < 5) {
              console.warn(`Retry join ${item.projectId}, attempt ${item.attempt}`);
              setTimeout(tryJoin, 200 * item.attempt);
            } else {
              reject(`Failed to join ${item.projectId} after retries`);
            }
          }
        });
      };

      // Đảm bảo socket connect trước khi join
      if (this.socket.connected) {
        tryJoin();
      } else {
        if (process.env.NODE_ENV === "development") console.log("⏳ Waiting for socket to connect before joining", item.projectId);
        this.onceConnected(tryJoin);
      }
    });
  }

  leaveProject(projectId: string) {
    if (!this.socket || !this.joinedProjects.has(projectId)) return;
    this.socket.emit("leaveProject", projectId, (ack: boolean) => {
      if (ack) this.joinedProjects.delete(projectId);
      else console.warn("Failed to leave project", projectId);
    });
  }

  /** Re-join rooms on connect: snapshot and re-queue */
  private joinAllRooms() {
    const joined = Array.from(this.joinedProjects);
    // clear set so joinProject will actually enqueue join actions
    this.joinedProjects.clear();
    joined.forEach((pid) => this.joinProject(pid));
  }

  disconnect() {
    if (!this.socket) return;
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
    this.socket?.once("connect", callback);
  }
}

// Singleton Next.js safe
declare global { var _projectSocketManager: ProjectSocketManager|undefined; }

export function getProjectSocketManager(){
  if(!globalThis._projectSocketManager){
    globalThis._projectSocketManager=new ProjectSocketManager();
  }
  return globalThis._projectSocketManager;
}
