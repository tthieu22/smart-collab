"use client";

import { projectService } from "@smart/services/project.service";
import { uploadService } from "@smart/services/upload.service";
import { projectStore } from "@smart/store/project";
import { useAuthStore } from "@smart/store/auth";
import type { Project } from "@smart/types/project";
import { getProjectSocketManager } from "@smart/store/realtime";

// -------------------- Helper --------------------
const getToken = () => useAuthStore.getState().accessToken ?? undefined;
const createCorrelationId = () => crypto.randomUUID();

// Singleton socket manager
const projectSocketManager = getProjectSocketManager();

// -------------------- Project API --------------------

export async function fetchAllProjects(): Promise<Project[]> {
  const token = getToken();
  const correlationId = createCorrelationId();
  try {
    const projectsBE: any[] = await projectService.getAllProjects({ correlationId }, token);
    projectsBE.forEach((p) => projectStore.getState().addProject(p));
    return projectsBE;
  } catch (err) {
    console.error("Failed to fetch projects:", err);
    return [];
  }
}

export async function fetchProject(projectId: string): Promise<Project | null> {
  const token = getToken();
  const correlationId = createCorrelationId();
  try {
    const projectBE: any = await projectService.getProject({ projectId, correlationId }, token);
    projectStore.getState().updateProject(projectBE);
    projectStore.getState().setCurrentProject(projectBE);
    return projectBE;
  } catch (err) {
    console.error("Failed to fetch project:", err);
    return null;
  }
}

export async function createProject(body: { name: string; description?: string }) {
  const token = getToken();
  const correlationId = createCorrelationId();

  projectSocketManager.subscribeCorrelation(correlationId, (msg) => {
    if (msg.project) projectStore.getState().addProject(msg.project);
    console.log("📩 Socket response (createProject):", msg);
  });

  const res = await projectService.createProject({ ...body, correlationId }, token);
  if (res.status === "queued") {
    console.log("Project creation queued:", res.correlationId);
  }
  return res;
}

export async function updateProject(projectId: string, body: { name?: string; description?: string; color?: string }) {
  const token = getToken();
  const correlationId = createCorrelationId();

  projectSocketManager.subscribeCorrelation(correlationId, (msg) => {
    if (msg.project) projectStore.getState().updateProject(msg.project);
    console.log("📩 Socket response (updateProject):", msg);
  });

  const res = await projectService.updateProject({ projectId, ...body, correlationId }, token);
  if (res.status === "queued") console.log("Project update queued:", res.correlationId);
  return res;
}

export async function deleteProject(projectId: string) {
  const token = getToken();
  const correlationId = createCorrelationId();

  projectSocketManager.subscribeCorrelation(correlationId, (msg) => {
    console.log("📩 Socket response (deleteProject):", msg);
    if (msg.status === "deleted") projectStore.getState().deleteProject(projectId);
  });

  const res = await projectService.deleteProject({ projectId, correlationId }, token);
  if (res.status === "queued") {
    projectStore.getState().deleteProject(projectId);
    console.log("Project deletion queued:", res.correlationId);
  }
  return res;
}

export async function addMember(projectId: string, userId: string, role?: string) {
  const token = getToken();
  const correlationId = createCorrelationId();

  projectSocketManager.subscribeCorrelation(correlationId, (msg) => {
    if (msg.member) projectStore.getState().addMember(projectId, msg.member);
    console.log("📩 Socket response (addMember):", msg);
  });

  return await projectService.addMember({ projectId, userId, role, correlationId }, token);
}

export async function removeMember(projectId: string, userId: string) {
  const token = getToken();
  const correlationId = createCorrelationId();

  projectSocketManager.subscribeCorrelation(correlationId, (msg) => {
    console.log("📩 Socket response (removeMember):", msg);
    if (msg.status === "removed") projectStore.getState().removeMember(projectId, userId);
  });

  return await projectService.removeMember({ projectId, userId, correlationId }, token);
}

export async function updateMemberRole(projectId: string, userId: string, role: string) {
  const token = getToken();
  const correlationId = createCorrelationId();

  projectSocketManager.subscribeCorrelation(correlationId, (msg) => {
    if (msg.status === "updated") projectStore.getState().updateMemberRole(projectId, userId, role);
    console.log("📩 Socket response (updateMemberRole):", msg);
  });

  return await projectService.updateMemberRole({ projectId, userId, role, correlationId }, token);
}

/** Luồng: create → upload → update → fetch → set store */
export async function createProjectWithFiles(
  body: { name: string; description?: string; color?: string },
  files: string[]
) {
  const token = getToken();
  const correlationId = createCorrelationId();

  projectSocketManager.subscribeCorrelation(correlationId, (msg) => {
    console.log("📩 Socket response (createProjectWithFiles):", msg);
    if (msg.project) projectStore.getState().updateProject(msg.project);
  });

  // 1. Tạo project
  const createRes = await projectService.createProject({ ...body, correlationId }, token);
  if (createRes.status !== "queued") throw new Error("Failed to queue project creation");

  const projectId = createRes.dto?.id;
  if (!projectId) console.warn("Project ID chưa có, upload trước, update sau");

  // 2. Upload file
  if (files.length > 0) {
    const uploadRes = await uploadService.uploadFiles(correlationId, files, token);
    if (!uploadRes.success) throw new Error("File upload failed");

    const uploadedFiles = uploadRes.data.map((f: any) => ({
      publicId: f.public_id,
      url: f.url,
      type: f.type,
      size: f.size,
      originalFilename: f.original_filename,
      resourceType: f.resource_type,
    }));

    if (projectId) await projectService.updateProject({ projectId, files: uploadedFiles, correlationId }, token);
  }

  // 3. Cập nhật color
  if (projectId && body.color) {
    await projectService.updateProject({ projectId, color: body.color, correlationId }, token);
  }

  // 4. Lấy project mới nhất
  if (projectId) return await fetchProject(projectId);
  return null;
}
