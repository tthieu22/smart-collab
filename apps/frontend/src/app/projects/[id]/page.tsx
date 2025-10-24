"use client";

import { useEffect, useState } from "react";
import { projectStore } from "@smart/store/project";
import { projectService } from "@smart/services/project.service";
import type { Project } from "@smart/types/project";
import { getProjectSocketManager } from "@smart/store/realtime";
import ProjectActionBar from "@smart/components/project/ProjectActionBar";
import {
  InboxOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  SwapOutlined,
} from "@ant-design/icons";

interface Props {
  params: { id: string };
}

const LOCAL_STORAGE_KEY = "activeProjectComponents";

export default function ProjectDetailPage({ params }: Props) {
  const projectId = params.id;
  const { currentProject, addProject, updateProject, setCurrentProject } =
    projectStore();
  const [loading, setLoading] = useState(true);

  // Active components state
  const [activeComponents, setActiveComponents] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ["inbox", "board"];
    }
    return ["inbox", "board"];
  });

  const project = currentProject?.id === projectId ? currentProject : null;

  const toggleComponent = (key: string) => {
    setActiveComponents((prev) => {
      const updated = prev.includes(key)
        ? prev.length > 1
          ? prev.filter((c) => c !== key)
          : prev
        : [...prev, key];
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // ------------------ SOCKET EVENTS ------------------
  useEffect(() => {
    const socketManager = getProjectSocketManager();
    let unsubCreated: () => void;
    let unsubUpdated: () => void;

    // Callback xử lý realtime project updates
    const handleProjectMsg = (msg: any) => {
      if (!msg?.project) return;
      const p: Project = msg.project;

      const isCurrent = currentProject?.id === p.id;
      if (isCurrent) {
        updateProject(p);
        setCurrentProject(p);
      } else {
        addProject(p);
      }
    };

    // Join project socket
    socketManager
      .joinProject(projectId)
      .then(() => console.log("Joined project socket:", projectId))
      .catch(console.error);

    // Subscribe correlation events
    unsubCreated = socketManager.subscribeCorrelation(
      "realtime.project.created",
      handleProjectMsg
    );
    unsubUpdated = socketManager.subscribeCorrelation(
      "realtime.project.updated",
      handleProjectMsg
    );

    return () => {
      // Cleanup khi unmount
      unsubCreated();
      unsubUpdated();
      socketManager.leaveProject(projectId);
    };
  }, [projectId]);

  // ------------------ INIT PROJECT ------------------
  useEffect(() => {
    let canceled = false;

    const initProject = async () => {
      setLoading(true);
      const socketManager = getProjectSocketManager();
      const correlationId = crypto.randomUUID();

      const projectPromise = new Promise<Project>((resolve, reject) => {
        const unsubscribe = socketManager.subscribeCorrelation(
          correlationId,
          (msg: any) => {
            if (msg.status === "success" && msg.project) resolve(msg.project);
            else reject(new Error(msg.message || "Fetch project failed"));
            unsubscribe();
          }
        );
      });

      try {
        await projectService.getProject({ projectId, correlationId });
        const p = await projectPromise;

        if (!canceled) {
          addProject(p);
          updateProject(p);
          setCurrentProject(p);
        }
      } catch (error) {
        console.error("Fetch project failed:", error);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    initProject();

    return () => {
      canceled = true;
    };
  }, [projectId, addProject, updateProject, setCurrentProject]);

  // ------------------ UI ------------------
  if (loading) return <p>Đang tải dự án...</p>;
  if (!project) return <p>Không tìm thấy dự án #{projectId}</p>;

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
    backgroundImage: project.fileUrl
      ? `url(${project.fileUrl})`
      : project.background
      ? `url(${project.background})`
      : undefined,
    backgroundColor: project.color ?? undefined,
  };

  return (
    <div className="relative">
      <div style={backgroundStyle} />
      <ProjectActionBar
        activeComponents={activeComponents}
        onToggle={toggleComponent}
      />
      <div className="relative z-10 p-4 space-y-4">
        <div className="rounded-lg p-6 shadow bg-white/80">
          <h1 className="text-2xl font-semibold mb-2">
            Chi tiết dự án #{project.id} - {project.name}
          </h1>
          <p>
            Chủ sở hữu: {project.owner?.firstName || ""}{" "}
            {project.owner?.lastName || ""} ({project.owner?.email})
          </p>
          <p>Visibility: {project.visibility || "Không xác định"}</p>
          <p>Members: {project.members?.length ?? 0}</p>
          {project.cards && <p>Cards: {project.cards.length}</p>}
        </div>

        {project.description && (
          <div className="rounded-lg p-4 shadow bg-white/80">
            <h2 className="text-lg font-semibold mb-1">Mô tả dự án</h2>
            <p>{project.description}</p>
          </div>
        )}

        {/* Render tất cả component active */}
        <div className="flex gap-4 text-3xl">
          {activeComponents.includes("inbox") && (
            <InboxOutlined className="text-blue-500" />
          )}
          {activeComponents.includes("calendar") && (
            <CalendarOutlined className="text-green-500" />
          )}
          {activeComponents.includes("board") && (
            <AppstoreOutlined className="text-purple-500" />
          )}
          {activeComponents.includes("switch") && (
            <SwapOutlined className="text-orange-500" />
          )}
        </div>
      </div>
    </div>
  );
}
