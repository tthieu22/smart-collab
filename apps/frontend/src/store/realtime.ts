// ----------------------------- projectSocketManager.ts -----------------------------
"use client";

import { io, Socket } from "socket.io-client";
import { projectStore, Project, Member, Task } from "./project";
import { useAuthStore } from "./auth";

export class ProjectSocketManager {
  private socket: Socket | null = null;
  private joinedProjects = new Set<string>();
  private accessToken: string | null = null;
  private tokenSubscribed = false;

  constructor() {
    // Không subscribe ngay trong constructor để tránh ReferenceError
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

    this.socket.on("connect_error", (err) =>
      console.error("⚠️ Socket connect_error", err)
    );
    this.socket.on("disconnect", (reason) =>
      console.log("❌ Socket disconnected", reason)
    );

    // ---------- PROJECT EVENTS ----------
    this.socket.on("project.created", (msg: { project: Project }) =>
      projectStore.getState().addProject(msg.project)
    );
    this.socket.on("project.updated", (msg: { project: Project }) =>
      projectStore.getState().updateProject(msg.project)
    );
    this.socket.on("project.deleted", (msg: { projectId: string }) =>
      projectStore.getState().deleteProject(msg.projectId)
    );

    // ---------- MEMBER EVENTS ----------
    this.socket.on(
      "project.member_added",
      (msg: { projectId: string; member: Member }) =>
        projectStore.getState().addMember(msg.projectId, msg.member)
    );
    this.socket.on(
      "project.member_removed",
      (msg: { projectId: string; userId: string }) =>
        projectStore.getState().removeMember(msg.projectId, msg.userId)
    );
    this.socket.on(
      "project.member_role_updated",
      (msg: { projectId: string; userId: string; role: string }) =>
        projectStore
          .getState()
          .updateMemberRole(msg.projectId, msg.userId, msg.role)
    );

    // ---------- TASK EVENTS ----------
    this.socket.on(
      "project.task_added",
      (msg: { projectId: string; task: Task }) =>
        projectStore.getState().addTask(msg.projectId, msg.task)
    );
    this.socket.on(
      "project.task_updated",
      (msg: { projectId: string; task: Task }) =>
        projectStore.getState().updateTask(msg.projectId, msg.task)
    );
    this.socket.on(
      "project.task_removed",
      (msg: { projectId: string; taskId: string }) =>
        projectStore.getState().removeTask(msg.projectId, msg.taskId)
    );

    this.socket.connect();
  }

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
