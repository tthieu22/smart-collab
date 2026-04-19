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

  useEffect(() => {
    let canceled = false;
    const socketManager = getProjectSocketManager();

    const hydrateProjectRealtime = async () => {
      const maxAttempts = 90;
      let prevSignature = '';
      let stableRounds = 0;

      for (let attempt = 1; attempt <= maxAttempts && !canceled; attempt += 1) {
        try {
          const rtRes: any = await socketManager.getColumns(projectId);
          const rtColumns = rtRes?.data;
          if (Array.isArray(rtColumns) && rtColumns.length > 0) {
            syncColumnsToStore(rtColumns);
          }
        } catch {
          // fallback below
        }

        try {
          const rtCardRes: any = await socketManager.getCards(projectId);
          const rtCards = rtCardRes?.data;
          if (Array.isArray(rtCards) && rtCards.length > 0) {
            syncCardsToStore(rtCards);
          }
        } catch {
          // fallback below
        }

        try {
          const apiRes: any = await projectService.getColumnsByProject(projectId);
          const apiColumns = apiRes?.data;
          if (Array.isArray(apiColumns) && apiColumns.length > 0) {
            syncColumnsToStore(apiColumns);
          }
        } catch {
          // keep retrying while AI build may still be creating columns
        }

        // Re-sync full snapshot to avoid missing late cards in near-final columns.
        try {
          const projectRes: any = await projectService.getProject({
            projectId,
            correlationId: crypto.randomUUID(),
          });
          const nextProject: Project | undefined =
            projectRes?.data ||
            projectRes?.dto?.project ||
            projectRes?.project ||
            projectRes?.dto;
          if (nextProject) {
            updateProject(nextProject);
            const nextDensity = getSnapshotDensity(nextProject);
            const stateNow = projectStore.getState();
            const currentColumnsCount = Object.keys(stateNow.columns).length;
            const currentCardsCount = Object.keys(stateNow.cards).length;
            const currentHasData = currentColumnsCount > 0 || currentCardsCount > 0;
            const nextIsNotWeaker =
              nextDensity.columnsCount >= currentColumnsCount &&
              nextDensity.cardsCount >= currentCardsCount;

            // Guard against transient/incomplete AI-build snapshots overriding full data.
            if (!currentHasData || nextIsNotWeaker) {
              setCurrentProject(nextProject);
            }
          }
        } catch {
          // keep polling; realtime may still be generating
        }

        const state = projectStore.getState();
        const columnsCount = Object.keys(state.columns).length;
        const cardsCount = Object.keys(state.cards).length;
        const signature = `${columnsCount}:${cardsCount}`;

        if (signature === prevSignature) {
          stableRounds += 1;
        } else {
          prevSignature = signature;
          stableRounds = 0;
        }

        // Stop only after data is stable for several rounds.
        if (columnsCount > 0 && stableRounds >= 4) {
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    };

    hydrateProjectRealtime();
    return () => {
      canceled = true;
    };
  }, [projectId, setCurrentProject, updateProject]);

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
      <div className="bg-gray-50 dark:bg-neutral-950 overflow-hidden min-h-[calc(100vh-56px)] flex flex-col">
        <ProjectActionBar
          activeComponents={activeComponents}
          onToggle={toggleComponent}
        />

        {/* ===== MAIN CONTENT ===== */}
        <div className="fixed inset-x-0 bottom-14 top-[100px]">
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
