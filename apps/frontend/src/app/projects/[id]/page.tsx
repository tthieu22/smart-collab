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

  const isSingle = activeComponents.length === 1;
  const compCount = activeComponents.length;

  const project = currentProject?.id === projectId ? currentProject : null;

  const inboxBoard = Object.values(boards).find((b) => b.type === 'inbox');
  const calendarBoard = Object.values(boards).find((b) => b.type === 'calendar');
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

  useEffect(() => {
    document.body.style.overflowY = 'hidden';
    return () => {
      document.body.style.overflowY = '';
    };
  }, []);

  useEffect(() => {
    const socketManager = getProjectSocketManager();
    const handleProjectMsg = (msg: any) => {
      if (!msg?.project || msg?.correlationId) return;
      const p = msg.project as Project;
      const hasSnapshot = Boolean(p?.boards?.length || p?.cards?.length);

      if (currentProject?.id === p.id) {
        hasSnapshot ? setCurrentProject(p) : updateProject(p);
      } else {
        addProject(p);
        if (hasSnapshot) setCurrentProject(p);
      }
    };

    socketManager.joinProject(projectId).catch(console.error);
    const unsubCreated = socketManager.subscribeCorrelation(
      'realtime.project.created',
      handleProjectMsg,
    );
    const unsubUpdated = socketManager.subscribeCorrelation(
      'realtime.project.updated',
      handleProjectMsg,
    );

    return () => {
      unsubCreated();
      unsubUpdated();
      socketManager.leaveProject(projectId);
    };
  }, [projectId]);

  useEffect(() => {
    let canceled = false;

    const initProject = async () => {
      setLoading(true);
      try {
        const correlationId = crypto.randomUUID();
        const res: any = await projectService.getProject({ projectId, correlationId });
        const p: Project | undefined =
          res?.data || res?.dto?.project || res?.project || res?.dto;

        if (!canceled && p) {
          addProject(p);
          updateProject(p);
          setCurrentProject(p);
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

  if (loading) return <Loading text="Đang tải dữ liệu" />;
  if (!project) return <Loading text="Không tìm thấy dự án :(" />;

  const bgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 0,
    background:
      theme === 'dark'
        ? 'radial-gradient(circle at 50% 50%, #2a2a3e 0%, #1e1e2f 100%)'
        : 'radial-gradient(circle at 50% 50%, #f8fafc 0%, #e2e8f0 100%)',
    backdropFilter: 'blur(8px)',
  };

  const fullClass =
    'flex-1 min-w-full max-h-full overflow-y-auto rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/30';

  const hasBoard = activeComponents.includes('board');
  const hasInbox = activeComponents.includes('inbox');
  const hasCalendar = activeComponents.includes('calendar');

  const inboxClass = isSingle
    ? fullClass
    : compCount === 2 && hasCalendar && !hasBoard
    ? 'flex-1 min-w-[150px] max-w-[300px] max-h-full overflow-y-auto rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/30'
    : compCount === 2 && hasBoard
    ? 'flex-1 min-w-[150px] max-w-[300px] max-h-full overflow-y-auto rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/30'
    : compCount > 2
    ? 'flex-1 min-w-[150px] max-w-[300px] max-h-full overflow-y-auto rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/30'
    : 'flex-1 min-w-[150px] max-w-[300px] max-h-full overflow-y-auto rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/30';

  const calendarClass = isSingle
    ? fullClass
    : compCount === 2 && hasInbox && !hasBoard
    ? 'flex-1 min-w-[350px] max-h-full overflow-y-auto rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/30'
    : compCount === 2 && hasBoard
    ? 'flex-1 min-w-[300px] max-h-full overflow-y-auto rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/30'
    : compCount > 2
    ? 'flex-1 min-w-[300px] max-h-full overflow-y-auto rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/30'
    : 'flex-1 min-w-[300px] max-w-[320px] max-h-full overflow-y-auto rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md';

  const boardClass = isSingle
    ? fullClass
    : compCount === 2
    ? 'flex-1 min-w-[700px] overflow-hidden rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/30'
    : 'flex-1 min-w-[800px] overflow-hidden rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/30';

  return (
    <div className="relative min-h-screen">
      <div style={bgStyle} className="opacity-90" />

      <ProjectActionBar activeComponents={activeComponents} onToggle={toggleComponent} />

      <div className="relative z-10 w-full h-screen overflow-hidden pt-16 pb-16">
        <DragDropContextProvider
          boardTypes={{
            ...(mainBoard ? { [mainBoard.id]: 'board' } : {}),
            ...(inboxBoard ? { [inboxBoard.id]: 'inbox' } : {}),
            ...(calendarBoard ? { [calendarBoard.id]: 'calendar' } : {}),
          }}
        >
          <div className="flex gap-3 h-full px-6 pb-6">
            {activeComponents.includes('inbox') && inboxBoard && (
              <div className={inboxClass}>
                <Inbox board={inboxBoard} />
              </div>
            )}

            {activeComponents.includes('calendar') && calendarBoard && (
              <div className={calendarClass}>
                <Calendar board={calendarBoard} />
              </div>
            )}

            {activeComponents.includes('board') && mainBoard && (
              <div className={boardClass}>
                <Board board={mainBoard} />
              </div>
            )}
          </div>
        </DragDropContextProvider>
      </div>
    </div>
  );
}
