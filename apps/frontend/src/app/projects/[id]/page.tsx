'use client';

import { useEffect, useRef, useState } from 'react';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import { getProjectSocketManager } from '@smart/store/realtime';
import ProjectActionBar from '@smart/components/project/ProjectActionBar';
import { Loading } from '@smart/components/ui/loading';

import Inbox from '@smart/components/project/inbox/Inbox';
import Calendar from '@smart/components/project/calendar/Calendar';
import Board from '@smart/components/project/board/Board';
import DragDropContextProvider from '@smart/components/project/dnd/DragDropProvider';

import { useBoardStore } from '@smart/store/setting';
import { Project } from '@smart/types/project';

interface Props {
  params: { id: string };
}

const LOCAL_STORAGE_KEY = 'activeProjectComponents';

export default function ProjectDetailPage({ params }: Props) {
  const projectId = params.id;
  const {
    currentProject,
    addProject,
    updateProject,
    setCurrentProject,
    boards,
    columns,
    columnCards,
    cards,
  } = projectStore();

  const theme = useBoardStore((state) => state.theme);
  const [loading, setLoading] = useState(true);
  const activeCorrelationIdRef = useRef<string | null>(null);

  const [activeComponents, setActiveComponents] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['inbox', 'board'];
    }
    return ['inbox', 'board'];
  });

  const project = currentProject?.id === projectId ? currentProject : null;

  // Lấy board theo type
  const inboxBoard = Object.values(boards).find((b) => b.type === 'inbox');
  const calendarBoard = Object.values(boards).find(
    (b) => b.type === 'calendar'
  );
  const mainBoard = Object.values(boards).find((b) => b.type === 'board');

  const toggleComponent = (key: string) => {
    setActiveComponents((prev) => {
      const updated = prev.includes(key)
        ? prev.length > 1
          ? prev.filter((c) => c !== key)
          : prev
        : [...prev, key];
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // ------------------ SOCKET EVENTS ------------------
  useEffect(() => {
    // Prevent window from being a vertical scroll parent while board columns scroll themselves
    const prev = document.body.style.overflowY;
    document.body.style.overflowY = 'hidden';
    return () => {
      document.body.style.overflowY = prev;
    };
  }, []);

  useEffect(() => {
    const socketManager = getProjectSocketManager();

    const handleProjectMsg = (msg: any) => {
      if (!msg?.project) return;
      // Ignore any correlated messages (responses to fetch)
      if (msg?.correlationId) return;
      const p = msg.project as Project;
      const hasSnapshot = Boolean(
        p?.boards?.length || (p as any)?.columns?.length || p?.cards?.length
      );
      if (currentProject?.id === p.id) {
        if (hasSnapshot) setCurrentProject(p);
        else updateProject(p);
      } else {
        if (hasSnapshot) {
          addProject(p);
          setCurrentProject(p);
        } else {
          addProject(p);
        }
      }
    };

    socketManager
      .joinProject(projectId)
      .then(() => console.log('Joined project socket:', projectId))
      .catch(console.error);

    const unsubCreated = socketManager.subscribeCorrelation(
      'realtime.project.created',
      handleProjectMsg
    );
    const unsubUpdated = socketManager.subscribeCorrelation(
      'realtime.project.updated',
      handleProjectMsg
    );

    return () => {
      unsubCreated();
      unsubUpdated();
      socketManager.leaveProject(projectId);
    };
  }, [projectId]);

  // ------------------ INIT PROJECT (REST) ------------------
  useEffect(() => {
    let canceled = false;

    const initProject = async () => {
      setLoading(true);
      try {
        const correlationId = crypto.randomUUID();
        const res: any = await projectService.getProject({
          projectId,
          correlationId,
        });
        console.log(res)
        const p: Project | undefined =
          res?.data || res?.dto?.project || res?.project || res?.dto;

        if (!canceled) {
          if (p) {
            addProject(p);
            updateProject(p);
            setCurrentProject(p);
          }
        }
      } catch (error) {
        console.error('Fetch project failed:', error);
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
  if (!project) return <Loading text="Không tìm thấy dự án :(" />;

  const backgroundStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 0,
    backgroundColor: theme === 'dark' ? '#1E1E2F' : '#F4F5F7',
  };

  return (
    <div className="relative">
      <div style={backgroundStyle} />
      <ProjectActionBar
        activeComponents={activeComponents}
        onToggle={toggleComponent}
      />
      <div className="relative z-10 w-full overflow-hidden">
        <DragDropContextProvider
          boardTypes={{
            ...(mainBoard ? { [mainBoard.id]: 'board' } : {}),
            ...(inboxBoard ? { [inboxBoard.id]: 'inbox' } : {}),
            ...(calendarBoard ? { [calendarBoard.id]: 'calendar' } : {}),
          }}
        >
          {/* ✅ mỗi board có khung riêng để scroll độc lập */}
          <div className="flex gap-4 w-full h-full overflow-hidden">
            {activeComponents.includes('inbox') && inboxBoard && (
              <div className="flex-1 min-w-[300px] max-h-[calc(100vh-100px)] overflow-y-auto rounded-2xl shadow-sm bg-white dark:bg-[#1f1f2e]">
                <Inbox board={inboxBoard} />
              </div>
            )}

            {activeComponents.includes('calendar') && calendarBoard && (
              <div className="flex-1 min-w-[300px] max-h-[calc(100vh-100px)] overflow-y-auto rounded-2xl shadow-sm bg-white dark:bg-[#1f1f2e]">
                <Calendar board={calendarBoard} />
              </div>
            )}

            {activeComponents.includes('board') && mainBoard && (
              <div className="flex-1 min-w-[400px] overflow-x-auto overflow-y-auto max-h-[calc(100vh-100px)] rounded-2xl shadow-sm bg-white dark:bg-[#1f1f2e]">
                <Board board={mainBoard} />
              </div>
            )}
          </div>
        </DragDropContextProvider>

      </div>
    </div>
  );
}
