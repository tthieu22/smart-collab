"use client";

import { projectService } from "@smart/services/project.service";
import { projectStore } from "@smart/store/project";
import { useAuthStore } from "@smart/store/auth";
import { randomUUID } from "crypto";
import type { Project, ProjectBE } from "@smart/types/project";
import { mapProjectBEtoFE } from "@smart/lib/helper";

// -------------------- Helper --------------------
const getToken = () => useAuthStore.getState().accessToken ?? undefined;
const createCorrelationId = () => randomUUID();

// -------------------- Project API --------------------
export async function fetchAllProjects(): Promise<Project[]> {
  const token = getToken();
  const correlationId = createCorrelationId();

  try {
    const projectsBE: any[] = await projectService.getAllProjects({ correlationId }, token);
    const projectsFE: Project[] = projectsBE.map(mapProjectBEtoFE);
    projectsFE.forEach((p) => projectStore.getState().addProject(p));
    return projectsFE;
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
    const projectFE: Project = mapProjectBEtoFE(projectBE);
    projectStore.getState().updateProject(projectFE);
    projectStore.getState().setCurrentProject(projectFE);
    return projectFE;
  } catch (err) {
    console.error("Failed to fetch project:", err);
    return null;
  }
}

export async function createProject(body: { name: string; description?: string }) {
  const token = getToken();
  const correlationId = createCorrelationId();

  const res = await projectService.createProject({ ...body, correlationId }, token);
  if (res.status === "queued") {
    console.log("Project creation queued with correlationId:", res.correlationId);
  }
  return res;
}

export async function updateProject(projectId: string, body: { name?: string; description?: string }) {
  const token = getToken();
  const correlationId = createCorrelationId();

  const res = await projectService.updateProject({ projectId, ...body, correlationId }, token);
  if (res.status === "queued") {
    console.log("Project update queued with correlationId:", res.correlationId);
  }
  return res;
}

export async function deleteProject(projectId: string) {
  const token = getToken();
  const correlationId = createCorrelationId();

  const res = await projectService.deleteProject({ projectId, correlationId }, token);
  if (res.status === "queued") {
    projectStore.getState().deleteProject(projectId);
    console.log("Project deletion queued with correlationId:", res.correlationId);
  }
  return res;
}

// -------------------- Component --------------------
export default function ProjectHeader() {
  return <header className="bg-gray-200 p-4">Project</header>;
}
