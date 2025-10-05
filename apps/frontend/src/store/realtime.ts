"use client";

import { io, Socket } from "socket.io-client";
import { projectStore } from "@smart/store/project";
import { useAuthStore } from "@smart/store/auth";

type CorrelationCallback = (msg: any) => void;

export class ProjectSocketManager {
  private socket: Socket | null = null;
  private joinedProjects = new Set<string>();
  private tokenSubscribed = false;
  private correlationCallbacks = new Map<string, CorrelationCallback[]>();

  constructor() {
    console.log("🟢 ProjectSocketManager initialized");
    this.subscribeToken();
  }

  /** Subscribe token từ auth store */
  private subscribeToken() {
    if (this.tokenSubscribed) return;
    this.tokenSubscribed = true;

    useAuthStore.subscribe((state) => {
      const token = state.accessToken;
      console.log("🟡 Auth token updated:", token);
      if (!token && this.socket) this.disconnect();
    });
  }

  /** Khởi tạo socket */
  initSocket() {
    if (this.socket) return this.socket;

    const authToken = useAuthStore.getState().accessToken;
    console.log("🟢 Initializing socket with token:", authToken);

    this.socket = io("http://localhost:3003", {
      auth: { token: authToken },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 5000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected", this.socket?.id);
      this.joinAllRooms();
    });

    this.socket.on("disconnect", (reason) => console.log("❌ Socket disconnected", reason));
    this.socket.on("connect_error", (err) => console.error("⚠️ Socket connect_error", err));

    // ================= Realtime Events =================
    const events = [
      "realtime.project.created",
      "realtime.project.updated",
      "realtime.project.deleted",
      "realtime.project.fetched",
      "realtime.project.listed",
      "realtime.project.member_added",
      "realtime.project.member_removed",
      "realtime.project.member_role_updated",
    ];

    events.forEach((event) => {
      this.socket?.on(event, (msg: any) => {
        console.log("📩 Socket event received:", event, msg);
        this.handleStoreUpdate(event, msg);

        // correlationId callbacks
        if (msg.correlationId) {
          const cbs = this.correlationCallbacks.get(msg.correlationId);
          if (cbs) {
            [...cbs].forEach((cb) => cb(msg));
            this.correlationCallbacks.delete(msg.correlationId);
          }
        }
      });
    });

    return this.socket;
  }

  /** Subscribe theo correlationId */
  subscribeCorrelation(correlationId: string, callback: CorrelationCallback): () => void {
    if (!this.correlationCallbacks.has(correlationId)) {
      this.correlationCallbacks.set(correlationId, []);
    }
    this.correlationCallbacks.get(correlationId)!.push(callback);

    return () => {
      const cbs = this.correlationCallbacks.get(correlationId);
      if (!cbs) return;
      this.correlationCallbacks.set(
        correlationId,
        cbs.filter((cb) => cb !== callback)
      );
    };
  }

  private handleStoreUpdate(event: string, msg: any) {
    switch (event) {
      case "realtime.project.created":
        projectStore.getState().addProject(msg.project);
        break;
      case "realtime.project.updated":
        projectStore.getState().updateProject(msg.project);
        break;
      case "realtime.project.deleted":
        projectStore.getState().deleteProject(msg.projectId);
        break;
      case "realtime.project.fetched":
        projectStore.getState().updateProject(msg.project);
        break;
      case "realtime.project.member_added":
        projectStore.getState().addMember(msg.projectId, msg.member);
        break;
      case "realtime.project.member_removed":
        projectStore.getState().removeMember(msg.projectId, msg.userId);
        break;
      case "realtime.project.member_role_updated":
        projectStore.getState().updateMemberRole(msg.projectId, msg.userId, msg.role);
        break;
    }
  }

  /** Tham gia project room */
  async joinProject(projectId: string) {
    const socket = this.initSocket();
    if (this.joinedProjects.has(projectId)) return;

    if (!socket.connected) {
      await new Promise<void>((resolve) => socket.once("connect", () => resolve()));
    }

    socket.emit("joinProject", projectId, (ack: boolean) => {
      if (ack) this.joinedProjects.add(projectId);
      else console.warn("Failed to join project room", projectId);
    });
  }

  /** Rời project room */
  leaveProject(projectId: string) {
    if (!this.socket || !this.joinedProjects.has(projectId)) return;

    this.socket.emit("leaveProject", projectId, (ack: boolean) => {
      if (ack) this.joinedProjects.delete(projectId);
      else console.warn("Failed to leave project room", projectId);
    });
  }

  private joinAllRooms() {
    this.joinedProjects.forEach(async (projectId) => await this.joinProject(projectId));
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.joinedProjects.clear();
    this.correlationCallbacks.clear();
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
