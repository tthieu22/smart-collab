"use client";

import { useEffect, useState } from "react";
import { projectStore } from "@smart/store/project";
import { projectService } from "@smart/services/project.service";
import type { Project } from "@smart/types/project";
import { getProjectSocketManager } from "@smart/store/realtime";

interface Props {
  params: { id: string };
}

export default function ProjectDetailPage({ params }: Props) {
  const { currentProject, allProjects, addProject, updateProject, setCurrentProject } =
    projectStore();
  const [loading, setLoading] = useState(true);
  const projectId = params.id;

  const project =
    currentProject?.id === projectId
      ? currentProject
      : allProjects.find((p) => p.id === projectId) ?? null;

  useEffect(() => {
    const socketManager = getProjectSocketManager();

    // Tham gia room để nhận realtime cho project này
    socketManager.joinProject(projectId);

    // Subscribe chung cho tất cả event realtime liên quan
    const handleMsg = (msg: any) => {
      if (!msg?.project) return;
      const p: Project = msg.project;
      const exists = allProjects.find((pr) => pr.id === p.id);
      if (exists) updateProject(p);
      else addProject(p);

      if (p.id === projectId) setCurrentProject(p);
    };

    const unsubCreated = socketManager.subscribeCorrelation("realtime.project.created", handleMsg);
    const unsubUpdated = socketManager.subscribeCorrelation("realtime.project.updated", handleMsg);

    return () => {
      unsubCreated();
      unsubUpdated();
    };
  }, [projectId, allProjects, addProject, updateProject, setCurrentProject]);

  useEffect(() => {
    let canceled = false;

    async function initProject() {
      setLoading(true); // reset loading khi id thay đổi

      const socketManager = getProjectSocketManager();
      const socket = socketManager.initSocket();
      await socketManager.joinProject(projectId);

      const correlationId = crypto.randomUUID();
      const projectPromise = new Promise<Project>((resolve, reject) => {
        const unsubscribe = socketManager.subscribeCorrelation(correlationId, (msg: any) => {
          if (msg.status === "success" && msg.project) {
            resolve(msg.project);
          } else {
            reject(new Error(msg.message || "Fetch project failed"));
          }
          unsubscribe();
        });
      });

      await projectService.getProject({ projectId, correlationId });
      const p = await projectPromise;

      if (!canceled) {
        projectStore.getState().addProject(p);
        projectStore.getState().updateProject(p);
        setLoading(false);
      }
    }

    initProject().catch(console.error);

    return () => {
      canceled = true;
    };
  }, [projectId]);



  if (loading) return <p>Đang tải dự án...</p>;
  if (!project) return <p>Không tìm thấy dự án #{projectId}</p>;

  // Full màn hình background
  const backgroundStyle: React.CSSProperties = {
    width: "100vw",
    height: "100vh",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 0,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  if (project.fileUrl) backgroundStyle.backgroundImage = `url(${project.fileUrl})`;
  else if (project.background) backgroundStyle.backgroundImage = `url(${project.background})`;
  else if (project.color) backgroundStyle.backgroundColor = project.color;
  else backgroundStyle.backgroundImage = "url(/backgrounds/muaxuan.png)";

  return (
    <div className="relative">
      <div style={backgroundStyle} />
      <div className="relative z-10 p-1 space-y-4">
        <div className="rounded-lg p-6 shadow bg-white/80">
          <h1 className="text-2xl font-semibold mb-2">
            Chi tiết dự án #{project.id} - {project.name}
          </h1>
          <p>
            Chủ sở hữu: {project.owner.firstName || ""} {project.owner.lastName || ""} (
            {project.owner.email})
          </p>
          <p>Visibility: {project.visibility || "Không xác định"}</p>
          <p>Members: {project.members.length}</p>
          {project.tasks && <p>Tasks: {project.tasks.length}</p>}
        </div>

        {project.description && (
          <div className="rounded-lg p-4 shadow bg-white/80">
            <h2 className="text-lg font-semibold mb-1">Mô tả dự án</h2>
            <p>{project.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
