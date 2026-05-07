'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { projectStore } from '@smart/store/project';
import { useUserStore } from '@smart/store/user';
import { projectService } from '@smart/services/project.service';
import { getProjectSocketManager } from '@smart/store/realtime';
import ProjectActionBar from '@smart/components/project/ProjectActionBar';
import ProjectGuestCursor from '@smart/components/project/ProjectGuestCursor';
import { Loading } from '@smart/components/ui/loading';
import { autoRequest } from '@smart/services/auto.request';
import { message, Modal, Popover, Button } from 'antd';

import dynamic from 'next/dynamic';

const Inbox = dynamic(() => import('@smart/components/project/inbox/Inbox'), { ssr: false, loading: () => <Loading /> });
const Calendar = dynamic(() => import('@smart/components/project/calendar/Calendar'), { ssr: false, loading: () => <Loading /> });
const Board = dynamic(() => import('@smart/components/project/board/Board'), { ssr: false, loading: () => <Loading /> });
const DragDropContextProvider = dynamic(() => import('@smart/components/project/dnd/DragDropProvider'), { ssr: false });
const ProjectChat = dynamic(() => import('@smart/components/project/chat/ProjectChat'), { ssr: false });
const ProjectRecycleBin = dynamic(() => import('@smart/components/project/recycle/ProjectRecycleBin'), { ssr: false });
import { motion } from 'framer-motion';
import { Monitor, Rocket, Star } from 'lucide-react';
import ProjectPresence from '@smart/components/project/ProjectPresence';

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

  const theme = useBoardStore((s) => s.theme);

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
      let components = saved ? JSON.parse(saved) : ['inbox', 'board'];
      if (!useUserStore.getState().currentUser) {
        components = ['board']; // Force only board for guests
      }
      return components;
    }
    return ['board'];
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

  // Tự động ẩn các component riêng tư/không cần thiết nếu đăng xuất hoặc là khách
  useEffect(() => {
    if (!currentUser) {
      setActiveComponents(['board']);
    }
  }, [currentUser]);

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


  if (loading && !project) {
    return null;
  }

  /** ===== Style dùng chung ===== */
  const basePanel =
    `flex flex-col overflow-hidden bg-white dark:bg-neutral-900 ${isSingle ? 'border-none rounded-none' : 'border rounded-lg'}`;

  const inboxClass = isSingle
    ? `${basePanel} flex-1`
    : `${basePanel} min-w-[300px] max-w-[300px]`;

  const calendarClass = isSingle
    ? `${basePanel} flex-1`
    : `${basePanel} min-w-[400px] max-w-[500px]`;

  const boardClass = isSingle
    ? `${basePanel} flex-1`
    : `${basePanel} min-w-[700px] flex-1`;

  const sidePanelClass = isSingle
    ? `${basePanel} flex-1`
    : `${basePanel} min-w-[350px] max-w-[400px]`;
  return (
    <SiteLayout hideLeftSidebar hideRightSidebar fullWidth hideFooter noScroll>
      {/* ===== MOBILE ONLY VIEW (UNIVERSE THEME) ===== */}
      <div className={`md:hidden fixed inset-0 z-[10000] flex flex-col items-center justify-center p-8 text-center overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950' : 'bg-blue-50'}`}>
        {/* Space Background Effects */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_50%_50%,_#1e293b_0%,_#020617_100%)] opacity-100' : 'bg-[radial-gradient(circle_at_50%_50%,_#dbeafe_0%,_#eff6ff_100%)] opacity-100'}`} />
        
        {/* Animated Nebulas/Clouds */}
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[100px] animate-pulse transition-colors duration-1000 ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-400/20'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[100px] animate-pulse transition-colors duration-1000 ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-indigo-400/20'}`} />
        
        {/* Content */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="relative mb-8">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border transition-all duration-500 ${theme === 'dark' ? 'bg-blue-600/20 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'bg-white border-blue-200 shadow-[0_10px_40px_rgba(59,130,246,0.15)]'}`}>
              <Monitor size={48} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
            </div>
            <motion.div 
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className={`absolute -top-4 -right-4 w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl transition-all duration-500 ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-blue-100'}`}
            >
              <Rocket size={20} className="text-blue-500" />
            </motion.div>
          </div>

          <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4 border transition-all duration-500 ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
            Trạm điều khiển • PC ONLY
          </div>
          
          <h2 className={`text-3xl font-black mb-4 uppercase tracking-tighter italic leading-none transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            DỰ ÁN QUÁ LỚN <br /> <span className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>CHO THIẾT BỊ NÀY!</span>
          </h2>
          
          <p className={`text-sm font-medium max-w-[280px] leading-relaxed mb-8 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Hệ thống quản trị dự án Smart Collab yêu cầu một buồng lái rộng hơn (Máy tính) để có thể vận hành tối đa công suất.
          </p>

          <Button 
            type="primary" 
            size="large"
            onClick={() => router.push('/')}
            className={`h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border-none ${theme === 'dark' ? 'bg-blue-600 shadow-blue-600/20' : 'bg-blue-600 shadow-blue-500/30'}`}
          >
            Về căn cứ (Home)
          </Button>

          <div className={`mt-12 flex items-center gap-4 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            <div className="flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Safe</span>
            </div>
            <div className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-blue-100'}`} />
            <div className="flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Secure</span>
            </div>
            <div className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-blue-100'}`} />
            <div className="flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Fast</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ===== DESKTOP CONTENT ===== */}
      <div className="hidden md:flex bg-white dark:bg-neutral-950 overflow-hidden min-h-[calc(100vh-56px)] flex-col">
        <ProjectGuestCursor />

        {currentUser && (
          <ProjectActionBar
            activeComponents={activeComponents}
            onToggle={toggleComponent}
          />
        )}

        {/* ===== MAIN CONTENT ===== */}
        <div className="fixed inset-x-0 bottom-14 top-[74px]">
          <DragDropContextProvider
            boardTypes={{
              ...(mainBoard ? { [mainBoard.id]: 'board' } : {}),
              ...(inboxBoard ? { [inboxBoard.id]: 'inbox' } : {}),
              ...(calendarBoard ? { [calendarBoard.id]: 'calendar' } : {}),
            }}
          >
            <div className={`flex h-full min-h-0 ${isSingle ? 'gap-0 p-0' : 'gap-3 px-4 pb-4'}`}>
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

              {/* ===== INLINE CHAT PANEL ===== */}
              {activeComponents.includes('chat') && (
                <div className={sidePanelClass}>
                  <ProjectChat projectId={projectId} />
                </div>
              )}
            </div>
          </DragDropContextProvider>
        </div>

        {/* ===== RECYCLE BIN MODAL ===== */}
        <Modal
          title={null}
          open={activeComponents.includes('recycle')}
          onCancel={() => toggleComponent('recycle')}
          footer={null}
          width={800}
          styles={{ body: { padding: 0 } }}
          className="recycle-bin-modal"
          centered
        >
          <div className="h-[600px] overflow-hidden rounded-2xl">
            <ProjectRecycleBin projectId={projectId} />
          </div>
        </Modal>
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
