"use client";

import { useEffect, useState } from "react";
import { projectStore } from "@smart/store/project";
import { projectService } from "@smart/services/project.service";
import { getProjectSocketManager } from "@smart/store/realtime";
import ProjectActionBar from "@smart/components/project/ProjectActionBar";
import { Loading } from "@smart/components/ui/loading";

import Inbox from "@smart/components/project/inbox/Inbox";
import Calendar from "@smart/components/project/calendar/Calendar";
import Board from "@smart/components/project/board/Board";
import DragDropProvider from "@smart/components/project/dnd/DragDropProvider";

import { useBoardStore } from "@smart/store/setting"; // store theme
import { Project } from "@smart/types/project";

interface Props {
  params: { id: string };
}

const LOCAL_STORAGE_KEY = "activeProjectComponents";

export default function ProjectDetailPage({ params }: Props) {
  const projectId = params.id;
  const {
    currentProject,
    addProject,
    updateProject,
    setCurrentProject,
    boards,
    columns,
    cards,
  } = projectStore();

  const theme = useBoardStore((state) => state.theme); // get theme
  const [loading, setLoading] = useState(true);

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

    const handleProjectMsg = (msg: any) => {
      if (!msg?.project) return;
      const p = msg.project;
      if (currentProject?.id === p.id) {
        updateProject(p);
        setCurrentProject(p);
      } else {
        addProject(p);
      }
    };

    socketManager.joinProject(projectId)
      .then(() => console.log("Joined project socket:", projectId))
      .catch(console.error);

    const unsubCreated = socketManager.subscribeCorrelation(
      "realtime.project.created",
      handleProjectMsg
    );
    const unsubUpdated = socketManager.subscribeCorrelation(
      "realtime.project.updated",
      handleProjectMsg
    );

    return () => {
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

    return () => { canceled = true; };
  }, [projectId]);

  // ------------------ UI ------------------
  if (loading) return <Loading text="Đang tải dữ liệu" />;
  if (!project) return <Loading text="Không tìm thấy dự án :(" />;

  // Background dựa vào theme, không lấy từ project
  const backgroundStyle: React.CSSProperties = {
    width: "100vw",
    height: "100%",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 0,
    backgroundColor: theme === "dark" ? "#1E1E2F" : "#F4F5F7",
  };

  return (
    <div className="relative">
      <div style={backgroundStyle} />
      <ProjectActionBar
        activeComponents={activeComponents}
        onToggle={toggleComponent}
      />
      <div className="relative z-10 p-4 space-y-4">
        {/* Project content */}
        <DragDropProvider>
          <div className="flex flex-wrap gap-4 text-3xl w-full min-h-[90vh]">
            {activeComponents.includes("inbox") && (
              <Inbox
                cards={Object.values(cards).filter(c => c.columnId === "inbox")}
                className="flex-1 min-w-[250px]"
              />
            )}

            {activeComponents.includes("calendar") && (
              <Calendar
                cards={Object.values(cards)}
                className="flex-1 min-w-[400px]"
              />
            )}

            {activeComponents.includes("board") && (
              <Board
                board={Object.values(boards)[0] ?? {
                  id: "board-temp",
                  projectId: project.id,
                  name: "Board",
                  columnIds: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }}
                className="flex-1 min-w-[300px]"
              />
            )}

          </div>
        </DragDropProvider>
      </div>
    </div>
  );
}
