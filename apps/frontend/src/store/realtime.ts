"use client";

import { io, Socket } from "socket.io-client";
import { projectStore } from "./project";
import { useAuthStore } from "./auth";
import { Project, Member, Task } from "@smart/types/project";

type CorrelationCallback = (msg: any) => void;

export class ProjectSocketManager {
  private socket: Socket | null = null;
  private joinedProjects = new Set<string>();
  private accessToken: string | null = null;
  private tokenSubscribed = false;

  // map correlationId -> callback
  private correlationCallbacks = new Map<string, CorrelationCallback[]>();

  constructor() {
    // Không subscribe ngay trong constructor
  }

  private subscribeToken() {
    if (this.tokenSubscribed) return;
    this.tokenSubscribed = true;

    useAuthStore.subscribe((state) => {
      const token = state.accessToken;
      if (!token && this.socket) this.disconnect();
      this.accessToken = token ?? null;
    });
  }

  initSocket(token?: string) {
    if (this.socket) return;

    this.subscribeToken();

    const authToken = token ?? this.accessToken ?? useAuthStore.getState().accessToken;

    this.socket = io("http://localhost:3003", {
      auth: { token: authToken },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 5000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected", this.socket?.id);
      this.joinAllRooms();
    });

    this.socket.on("disconnect", (reason) =>
      console.log("❌ Socket disconnected", reason)
    );

    this.socket.on("connect_error", (err) =>
      console.error("⚠️ Socket connect_error", err)
    );

    // ---------------- PROJECT EVENTS ----------------
    const events = [
      "project.created",
      "project.updated",
      "project.deleted",
      "project.member_added",
      "project.member_removed",
      "project.member_role_updated",
      "project.task_added",
      "project.task_updated",
      "project.task_removed",
      "project.fetched",
      "project.listed",
      "upload.completed",
      "upload.updated",
      "upload.deleted",
      "upload.deleted_all",
    ];

    events.forEach((event) => {
      this.socket?.on(event, (msg: any) => {
        // Cập nhật store nếu là project/member/task
        this.handleStoreUpdate(event, msg);

        // Gọi callback nếu correlationId match
        if (msg.correlationId && this.correlationCallbacks.has(msg.correlationId)) {
          const cbs = this.correlationCallbacks.get(msg.correlationId)!;
          cbs.forEach((cb) => cb(msg));
          // Xóa callback sau khi gọi để tránh rò rỉ
          this.correlationCallbacks.delete(msg.correlationId);
        }
      });
    });

    this.socket.connect();
  }

  // ---------------- Helper để subscribe theo correlationId ----------------
  subscribeCorrelation(correlationId: string, callback: CorrelationCallback) {
    if (!this.correlationCallbacks.has(correlationId)) {
      this.correlationCallbacks.set(correlationId, []);
    }
    this.correlationCallbacks.get(correlationId)!.push(callback);
  }

  // ---------------- Store update ----------------
  private handleStoreUpdate(event: string, msg: any) {
    switch (event) {
      case "project.created":
        projectStore.getState().addProject(msg.project);
        break;
      case "project.updated":
        projectStore.getState().updateProject(msg.project);
        break;
      case "project.deleted":
        projectStore.getState().deleteProject(msg.projectId);
        break;
      case "project.member_added":
        projectStore.getState().addMember(msg.projectId, msg.member);
        break;
      case "project.member_removed":
        projectStore.getState().removeMember(msg.projectId, msg.userId);
        break;
      case "project.member_role_updated":
        projectStore.getState().updateMemberRole(msg.projectId, msg.userId, msg.role);
        break;
      case "project.task_added":
        projectStore.getState().addTask(msg.projectId, msg.task);
        break;
      case "project.task_updated":
        projectStore.getState().updateTask(msg.projectId, msg.task);
        break;
      case "project.task_removed":
        projectStore.getState().removeTask(msg.projectId, msg.taskId);
        break;
      default:
        break; // upload hoặc fetch/list handled by correlation callback
    }
  }

  // ---------------- Project room management ----------------
  joinProject(projectId: string) {
    if (!this.socket) this.initSocket(this.accessToken ?? undefined);
    if (this.joinedProjects.has(projectId)) return;

    this.socket?.emit("joinProject", projectId, (ack: boolean) => {
      if (ack) {
        this.joinedProjects.add(projectId);
        console.log("✅ Joined project room", projectId);
      }
    });
  }

  leaveProject(projectId: string) {
    if (!this.socket || !this.joinedProjects.has(projectId)) return;

    this.socket.emit("leaveProject", projectId, (ack: boolean) => {
      if (ack) {
        this.joinedProjects.delete(projectId);
        console.log("❌ Left project room", projectId);
      }
    });
  }

  private joinAllRooms() {
    this.joinedProjects.forEach((projectId) => {
      this.socket?.emit("joinProject", projectId);
    });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.joinedProjects.clear();
    this.correlationCallbacks.clear();
    console.log("❌ Socket fully disconnected");
  }
}

// Lazy init singleton
let _projectSocketManager: ProjectSocketManager | null = null;

export function getProjectSocketManager() {
  if (!_projectSocketManager) {
    _projectSocketManager = new ProjectSocketManager();
  }
  return _projectSocketManager;
}
