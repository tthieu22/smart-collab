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
import { Loading } from "@smart/components/ui/loading";

import Inbox from "@smart/components/project/inbox/Inbox";
import Calendar from "@smart/components/project/calendar/Calendar";
import Board from "@smart/components/project/board/Board";
import { useBoardStore } from "@smart/store/board";
import DragDropProvider from "@smart/components/project/dnd/DragDropProvider";

interface Props {
  params: { id: string };
}

const LOCAL_STORAGE_KEY = "activeProjectComponents";

export default function ProjectDetailPage({ params }: Props) {
  const projectId = params.id;
  const { currentProject, addProject, updateProject, setCurrentProject } =
    projectStore();
  const [loading, setLoading] = useState(true);
  
  const { containers } = useBoardStore();

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

      if (!socketManager.isConnected()) {
        await new Promise<void>((resolve) => {
          socketManager.onceConnected(resolve);
          socketManager.initSocket();
        });
      }

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
          projectStore.getState().addProject(p);
          projectStore.getState().updateProject(p);
          projectStore.getState().setCurrentProject(p);
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
  }, [projectId]);

  // ------------------ UI ------------------
  if (loading) return <Loading text="Đang tải dữ liệu" />;
  if (!project) return <Loading text="Không tim thấy dự án. Chắc là sai ở đâu đó thôi :((" />;

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
            {project.name}
          </h1>
        </div>
        {/* Render tất cả component active */}
        <div className="flex gap-4 text-3xl">
        <DragDropProvider>
          <div className="flex gap-4 text-3xl">
            {activeComponents.includes("inbox") && (
              <Inbox
                cards={project.cards?.filter(c => c.columnId === "inbox") ?? []}
              />
            )}

            {activeComponents.includes("calendar") && (
              <Calendar cards={project.cards ?? []} />
            )}

            {activeComponents.includes("board") && (
              <Board
                board={
                  project.boards?.[0] ?? {
                    id: "board-temp",
                    projectId: project.id,
                    name: "Board",
                    columns: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                }
              />
            )}

            {activeComponents.includes("switch") && (
              <SwapOutlined className="text-orange-500" />
            )}
          </div>
        </DragDropProvider>

        </div>
      </div>
    </div>
  );
}
