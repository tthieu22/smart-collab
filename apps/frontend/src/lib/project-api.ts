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
  files: string[] = []
): Promise<Project> {

  const correlationId = createCorrelationId();

  // Hàm helper lắng nghe socket
  const waitForProject = (corrId: string) =>
    new Promise<Project>((resolve, reject) => {
      const unsubscribe = projectSocketManager.subscribeCorrelation(
        corrId,
        (msg) => {
          console.log("📩 Socket response:", msg);

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

  // 1️⃣ Tạo project
  await projectService.createProject({ ...body, correlationId });
  const projectBE = await waitForProject(correlationId);

  // 2️⃣ Lưu vào store
  projectStore.getState().addProject(projectBE);
  projectStore.getState().setCurrentProject(projectBE);

  // 3️⃣ Chuẩn bị dữ liệu update
  const updateData: any = { projectId: projectBE.id, correlationId: createCorrelationId() };

  // 4️⃣ Upload files nếu có
  if (files.length > 0) {
    const uploadCorrelationId = createCorrelationId();
    const uploadRes = await uploadService.uploadFiles(uploadCorrelationId, files);

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

  // 5️⃣ Cập nhật color nếu có
  if (body.color) {
    updateData.color = body.color;
  }

  // 6️⃣ Gọi updateProject nếu cần và chờ socket trả về
  if (updateData.files || updateData.color) {
    await projectService.updateProject(updateData);
    const updatedProject = await waitForProject(updateData.correlationId);
    
    // 7️⃣ Cập nhật store với dữ liệu mới
    projectStore.getState().updateProject(updatedProject);
    projectStore.getState().setCurrentProject(updatedProject);

    return updatedProject;
  }

  return projectBE;
}
