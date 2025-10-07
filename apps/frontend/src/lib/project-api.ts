"use client";

import { projectService } from "@smart/services/project.service";
import { uploadService } from "@smart/services/upload.service";
import { projectStore } from "@smart/store/project";
import type { Project } from "@smart/types/project";
import { getProjectSocketManager } from "@smart/store/realtime";

const createCorrelationId = () => crypto.randomUUID();

// Singleton socket manager
const projectSocketManager = getProjectSocketManager();

// -------------------- Project API --------------------

export async function fetchAllProjects(): Promise<Project[]> {
  const correlationId = createCorrelationId();

  await projectService.getAllProjects({ correlationId });
  // BE emit → socket nhận → addProject
  return projectStore.getState().allProjects;  // luôn lấy từ store
}

export async function fetchProject(projectId: string): Promise<Project | null> {
  const correlationId = createCorrelationId();

  await projectService.getProject({ projectId, correlationId });
  return projectStore.getState().allProjects.find((p) => p.id === projectId) ?? null;
}

export async function createProject(body: { name: string; visibility?: string }) {
  const correlationId = createCorrelationId();

  await projectService.createProject({ ...body, correlationId });
  return projectStore.getState().allProjects.at(0); // hoặc find theo correlation
}

export async function updateProject(projectId: string, body: { name?: string; visibility?: string; color?: string }) {
  const correlationId = createCorrelationId();

  await projectService.updateProject({ projectId, ...body, correlationId });
  return projectStore.getState().allProjects.find((p) => p.id === projectId);
}

export async function deleteProject(projectId: string) {
  const correlationId = createCorrelationId();

  await projectService.deleteProject({ projectId, correlationId });
  return !projectStore.getState().allProjects.some((p) => p.id === projectId);
}

export async function addMember(projectId: string, userId: string, role?: string) {
  const correlationId = createCorrelationId();

  await projectService.addMember({ projectId, userId, role, correlationId });
  return projectStore.getState().allProjects
    .find((p) => p.id === projectId)?.members.find((m) => m.userId === userId);
}

export async function removeMember(projectId: string, userId: string) {
  const correlationId = createCorrelationId();

  await projectService.removeMember({ projectId, userId, correlationId });
  return !projectStore.getState().allProjects
    .find((p) => p.id === projectId)?.members.some((m) => m.userId === userId);
}

export async function updateMemberRole(projectId: string, userId: string, role: string) {
  const correlationId = createCorrelationId();

  await projectService.updateMemberRole({ projectId, userId, role, correlationId });
  return projectStore.getState().allProjects
    .find((p) => p.id === projectId)?.members.find((m) => m.userId === userId)?.role;
}
export async function createProjectWithFiles(
  body: { name: string; visibility?: string; color?: string },
  files: File[] = []
): Promise<Project> {
  const createCorrId = createCorrelationId();

  const waitForProject = (corrId: string) =>
    new Promise<Project>((resolve, reject) => {
      const unsubscribe = projectSocketManager.subscribeCorrelation(
        corrId,
        (msg) => {
          if (msg.status === "success" && msg.project) {
            resolve(msg.project);
            unsubscribe();
          } else if (msg.status === "error") {
            reject(new Error(msg.error || "Project operation failed"));
            unsubscribe();
          }
        }
      );
    });

  // 2️⃣ Create project
  await projectService.createProject({ ...body, correlationId: createCorrId });
  const project = await waitForProject(createCorrId);

  // 3️⃣ Lưu vào store
  projectStore.getState().addProject(project);
  projectStore.getState().setCurrentProject(project);

  // 4️⃣ Nếu cần update files hoặc color
  if (files.length > 0 || body.color) {
    const updateCorrId = createCorrelationId();
    const updateData: any = { projectId: project.id, correlationId: updateCorrId };

    if (files.length > 0) {
      const folder = project.folderPath || project.id;
      const uploadRes = await uploadService.uploadFiles(folder, files);
      if (!uploadRes.success) throw new Error("File upload failed");

      updateData.files = (uploadRes.data || []).map((f: any) => ({
        publicId: f.public_id,
        url: f.url,
        type: f.type,
        size: f.size,
        originalFilename: f.original_filename,
        resourceType: f.resource_type,
      }));
    }

    if (body.color) updateData.color = body.color;

    // 5️⃣ Gọi update project riêng
    await projectService.updateProject(updateData);
    const updatedProject = await waitForProject(updateCorrId);

    // 6️⃣ Cập nhật store
    projectStore.getState().updateProject(updatedProject);
    projectStore.getState().setCurrentProject(updatedProject);

    return updatedProject;
  }

  return project;
}
