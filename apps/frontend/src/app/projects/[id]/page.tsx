'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { projectStore } from '@smart/store/project';
import { useUserStore } from '@smart/store/user';
import { projectService } from '@smart/services/project.service';
import { getProjectSocketManager } from '@smart/store/realtime';
import ProjectActionBar from '@smart/components/project/ProjectActionBar';
import { Loading } from '@smart/components/ui/loading';
import { autoRequest } from '@smart/services/auto.request';
import { message } from 'antd';

import Inbox from '@smart/components/project/inbox/Inbox';
import Calendar from '@smart/components/project/calendar/Calendar';
import Board from '@smart/components/project/board/Board';
import DragDropContextProvider from '@smart/components/project/dnd/DragDropProvider';

import SiteLayout from '@smart/components/layouts/SiteLayout';
import { useBoardStore } from '@smart/store/setting';
import { Card, Column, Project } from '@smart/types/project';

interface Props {
  params: { id: string };
}

const LOCAL_STORAGE_KEY = 'activeProjectComponents';

export default function ProjectDetailPage({ params }: Props) {
  const projectId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useUserStore();

  const {
    currentProject,
    addProject,
    updateProject,
    setCurrentProject,
    boards,
  } = projectStore();

  const [loading, setLoading] = useState(true);
  const activeCorrelationIdRef = useRef<string | null>(null);

  // Auto-join project if invited
  useEffect(() => {
    const handleInvite = async () => {
      const isInvite = searchParams.get('invite');
      if (isInvite === 'true' && currentUser?.id && projectId) {
        try {
          await autoRequest('/projects/members', {
            method: 'POST',
            body: JSON.stringify({ projectId, userId: currentUser.id }),
          });
          message.success('Bạn đã tham gia dự án thành công!');
          // Remove query params
          router.replace(`/projects/${projectId}`, { scroll: false });
        } catch (error) {
          console.error('Failed to auto-join project:', error);
        }
      }
    };
    handleInvite();
  }, [searchParams, currentUser?.id, projectId, router]);

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

  const syncColumnsToStore = (columnList: Column[]) => {
    const store = projectStore.getState();
    columnList.forEach((col) => {
      const cardsInColumn: Card[] = Array.isArray(col.cards) ? col.cards : [];
      const nextColumn: Column = {
        ...col,
        cardIds: col.cardIds ?? cardsInColumn.map((card) => card.id),
      };
      store.updateColumn(nextColumn);
      if (nextColumn.boardId) {
        store.addColumn(nextColumn.boardId, nextColumn);
      }
      if (cardsInColumn.length) {
        store.addCard(nextColumn.id, cardsInColumn);
      }
    });
  };

  const syncCardsToStore = (cards: Card[]) => {
    const store = projectStore.getState();
    cards.forEach((card) => {
      if (!card?.id || !card?.columnId) return;
      store.addCard(card.columnId, card);
    });
  };

  const getSnapshotDensity = (project?: Project | null) => {
    const boardsCount = Array.isArray(project?.boards) ? project!.boards.length : 0;
    const columnsCount = Array.isArray(project?.columns)
      ? project!.columns.length
      : Array.isArray(project?.boards)
        ? project!.boards.reduce(
          (sum, board) => sum + (Array.isArray(board.columns) ? board.columns.length : 0),
          0
        )
        : 0;
    const cardsCount = Array.isArray(project?.cards) ? project!.cards.length : 0;
    return { boardsCount, columnsCount, cardsCount };
  };

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

    // Only join when entering this project detail page
    projectStore.getState().setActiveProjectId(projectId);

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
    };
  }, [projectId]);

  // Best-effort leave on browser back/refresh/tab close
  useEffect(() => {
    const leave = () => projectStore.getState().setActiveProjectId(null);

    window.addEventListener('pagehide', leave);
    window.addEventListener('beforeunload', leave);
    return () => {
      window.removeEventListener('pagehide', leave);
      window.removeEventListener('beforeunload', leave);
    };
  }, [projectId]);

  useEffect(() => {
    const initProject = async () => {
      const store = projectStore.getState();
      const hasDataAlready = store.currentProject?.id === projectId && store.currentProject.boards?.length;

      if (!hasDataAlready) {
        setLoading(true);
      } else {
        setLoading(false);
      }

      try {
        await store.fetchProjectById(projectId);
      } catch (error) {
        console.error('Fetch project failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initProject();
  }, [projectId]);

  // Removed polling based hydrateProjectRealtime as we now rely on pure Realtime events
  // for AI generation and updates.


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
    <SiteLayout hideLeftSidebar hideRightSidebar fullWidth hideFooter noScroll>
      <div className="bg-gray-50 dark:bg-neutral-950 overflow-hidden min-h-[calc(100vh-56px)] flex flex-col">
        <ProjectActionBar
          activeComponents={activeComponents}
          onToggle={toggleComponent}
        />

        {/* ===== MAIN CONTENT ===== */}
        <div className="fixed inset-x-0 bottom-0 top-[104px]">
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

      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        /* Track */
        ::-webkit-scrollbar-track {
          background: transparent;
        }

        /* Handle */
        ::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
          transition: background 0.3s;
        }

        /* Handle on hover */
        ::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .dark ::-webkit-scrollbar-thumb {
          background: #404040;
        }

        .dark ::-webkit-scrollbar-thumb:hover {
          background: #525252;
        }

        /* Hide scrollbar track but show thumb on hover or active scroll */
        * {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }

        .dark * {
          scrollbar-color: #404040 transparent;
        }
      `}</style>
    </SiteLayout>
  );
}
