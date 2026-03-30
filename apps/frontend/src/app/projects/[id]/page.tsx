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

import SiteLayout from '@smart/components/layouts/SiteLayout';
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

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Note: không chặn scroll toàn trang để header/footer luôn hiển thị.

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
  if (!project) return <Loading text="Không tìm thấy dự án" />;

  /** ===== Style dùng chung ===== */
  const basePanel =
    'flex flex-col overflow-hidden border rounded-lg bg-white dark:bg-neutral-900';

  const inboxClass = isSingle
    ? `${basePanel} flex-1`
    : `${basePanel} min-w-[300px] max-w-[300px]`;

  const calendarClass = isSingle
    ? `${basePanel} flex-1`
    : `${basePanel} min-w-[400px] max-w-[500px]`;

  const boardClass = isSingle
    ? `${basePanel} flex-1`
    : `${basePanel} min-w-[700px]`;

  return (
    <SiteLayout hideLeftSidebar hideRightSidebar fullWidth hideFooter>
      <div className="bg-gray-50 dark:bg-neutral-950 overflow-hidden min-h-[calc(100vh-56px)]">
        <ProjectActionBar
          activeComponents={activeComponents}
          onToggle={toggleComponent}
        />

        {/* ===== MAIN CONTENT ===== */}
        <div className="fixed inset-x-0 bottom-14 top-16">
          <DragDropContextProvider
            boardTypes={{
              ...(mainBoard ? { [mainBoard.id]: 'board' } : {}),
              ...(inboxBoard ? { [inboxBoard.id]: 'inbox' } : {}),
              ...(calendarBoard ? { [calendarBoard.id]: 'calendar' } : {}),
            }}
          >
            <div className="flex h-full min-h-0 gap-3 px-4 pb-4">
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
    </SiteLayout>
  );
}
