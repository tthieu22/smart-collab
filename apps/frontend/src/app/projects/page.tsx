'use client';

import { useEffect, useState, useRef } from 'react';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import type { Project } from '@smart/types/project';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { useHomeFeedBootstrap } from '@smart/hooks/useHomeFeed';
import { Button, Tooltip, Tour, Modal, type TourProps } from 'antd';
import { Card } from '@smart/components/ui/card';
import ProjectCard from '@smart/components/project/ProjectCard';
import CreateBoardButton from '@smart/components/layouts/header/CreateBoardButton';
import { PlusOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { LayoutGrid, Columns, Square, Info, Plus, FolderPlus, Sparkles, X, Globe, Eye, EyeOff, LogIn } from 'lucide-react';
import { PremiumPagination } from '@smart/components/ui/PremiumPagination';
import { PageHeader } from '@smart/components/ui/PageHeader';
import { UI_CONFIG, ROUTES } from '@smart/lib/constants';
import { cn } from '@smart/lib/utils';
import { useAuthStore } from '@smart/store/auth';

export default function ProjectListPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const allProjects = projectStore((s) => s.allProjects);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPublicProjects, setShowPublicProjects] = useState(false);
  const pageSize = 20;

  // Tour refs
  const headerRef = useRef(null);
  const createBtnRef = useRef(null);
  const aiInfoRef = useRef(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [forceAiOpen, setForceAiOpen] = useState(false);
  const [showFirstProjectModal, setShowFirstProjectModal] = useState(false);

  useHomeFeedBootstrap();

  const handleTourClose = () => {
    setTourOpen(false);
    setForceAiOpen(true);
  };

  const [gridCols, setGridCols] = useState<1 | 2 | 3>(3);

  useEffect(() => {
    projectStore.getState().setActiveProjectId(null);

    // Sync initial state from store if available for fast load (only if logged in)
    if (accessToken && allProjects.length > 0 && currentPage === 1) {
      setProjects(allProjects.slice(0, pageSize));
    }

    const hasSeenTour = localStorage.getItem('hasSeenProjectsTour');
    if (!hasSeenTour && accessToken) {
      setTourOpen(true);
      localStorage.setItem('hasSeenProjectsTour', 'true');
    }
  }, [accessToken]);

  const load = async (page: number) => {
    // Only show loading if we don't have data yet to avoid flickering
    if (projects.length === 0) setLoading(true);

    try {
      const res: any = await projectService.getAllProjects({
        page,
        limit: pageSize
      });

      if (res.success && res.data && Array.isArray(res.data.items)) {
        const list: Project[] = res.data.items;
        const st = projectStore.getState();

        if (accessToken) {
          // Add each project to store (internal logic handles duplicates)
          list.forEach((p) => st.addProject(p));
        }

        setProjects(list);
        setTotal(res.data.total || 0);

        if (accessToken && list.length === 0 && page === 1) {
          setShowFirstProjectModal(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Only auto-load when authenticated
  useEffect(() => {
    if (accessToken) {
      load(currentPage);
    }
  }, [currentPage, accessToken]);

  const handleTogglePublicProjects = () => {
    if (!showPublicProjects) {
      setShowPublicProjects(true);
      if (projects.length === 0) {
        load(1);
      }
    } else {
      setShowPublicProjects(false);
    }
  };

  const tourSteps: TourProps['steps'] = [
    {
      title: 'Chào mừng bạn đến với Dự án!',
      description: 'Đây là nơi bạn quản lý tất cả các bảng công việc và không gian cộng tác của mình.',
      target: () => headerRef.current,
    },
    {
      title: 'Tạo dự án mới',
      description: 'Bạn có thể tạo dự án thủ công hoặc sử dụng AI để xây dựng cấu trúc dự án chỉ trong vài giây.',
      target: () => createBtnRef.current,
    },
    {
      title: 'Sức mạnh của AI',
      description: 'Nhấn vào đây để xem hướng dẫn cách viết prompt hiệu quả cho AI tạo dự án.',
      target: () => aiInfoRef.current,
    },
  ];

  const extra = (
    <div className="flex items-center gap-2">
      <div className="flex items-center bg-gray-100 dark:bg-neutral-900 p-1 rounded-xl ring-1 ring-black/5">
        <button
          onClick={() => setGridCols(1)}
          className={`p-2 rounded-lg transition-all ${gridCols === 1 ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
          title="1 Column"
        >
          <Square size={18} />
        </button>
        <button
          onClick={() => setGridCols(2)}
          className={`p-2 rounded-lg transition-all ${gridCols === 2 ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
          title="2 Columns"
        >
          <Columns size={18} />
        </button>
        <button
          onClick={() => setGridCols(3)}
          className={`hidden lg:flex p-2 rounded-lg transition-all ${gridCols === 3 ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
          title="3 Columns"
        >
          <LayoutGrid size={18} />
        </button>
      </div>

      <Tooltip title="Xem hướng dẫn">
        <Button
          icon={<Info size={18} />}
          onClick={() => setTourOpen(true)}
          className="h-9 w-9 rounded-xl flex items-center justify-center bg-white dark:bg-neutral-900 border-none shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:text-blue-500 transition-all"
        />
      </Tooltip>

      <div ref={createBtnRef}>
        <CreateBoardButton mode="modal" forceAiOpen={forceAiOpen} onAiClose={() => setForceAiOpen(false)}>
          <Button
            type="primary"
            icon={<Plus size={18} strokeWidth={3} />}
            className="rounded-xl shadow-md shadow-blue-500/20 h-9 px-3 font-bold flex items-center gap-1.5 border-none bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-[13px]"
          >
            Dự án mới
          </Button>
        </CreateBoardButton>
      </div>
    </div>
  );

  return (
    <SiteLayout fullWidth={false}>
      <div className={cn(
        UI_CONFIG.CONTAINER,
        UI_CONFIG.MAX_WIDTH.WIDE,
        UI_CONFIG.PAGE_SPACING,
        UI_CONFIG.ANIMATION.FADE_IN
      )}>
        <div ref={headerRef}>
          <PageHeader
            icon={<LayoutGrid />}
            title="Dự án của bạn"
            description="Quản lý và theo dõi tiến độ công việc trong các không gian cộng tác."
            extra={extra}
          />
        </div>

        {/* TRƯỜNG HỢP 1: NGƯỜI DÙNG CHƯA ĐĂNG NHẬP */}
        {!accessToken ? (
          <div className="space-y-6">
            {!showPublicProjects ? (
              <Card padding="large" className="relative overflow-hidden border border-gray-200 dark:border-neutral-800 bg-gradient-to-b from-white to-gray-50/50 dark:from-neutral-900 dark:to-neutral-950 p-8 sm:p-12 text-center rounded-3xl shadow-sm">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10 ring-4 ring-blue-500/5">
                  <Globe className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
                  Khám phá các dự án trên SmartCollab
                </h3>

                <p className="text-sm sm:text-base text-gray-500 dark:text-neutral-400 max-w-xl mx-auto mb-8 leading-relaxed">
                  Bạn đang xem ở chế độ khách. Đăng nhập để quản lý các dự án cá nhân hoặc bấm nút bên dưới để mở xem các dự án cộng tác công khai tiêu biểu.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3.5">
                  <Button
                    type="primary"
                    size="large"
                    icon={<Sparkles size={17} className="inline mr-1 text-yellow-300" />}
                    onClick={() => setForceAiOpen(true)}
                    className="h-12 px-6 rounded-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/25 border-none text-white active:scale-95 transition-all text-sm flex items-center"
                  >
                    Tạo dự án với AI
                  </Button>

                  <Button
                    size="large"
                    icon={<Eye size={18} className="inline mr-1 text-blue-500" />}
                    onClick={handleTogglePublicProjects}
                    className="h-12 px-6 rounded-xl font-bold border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 active:scale-95 transition-all text-sm"
                  >
                    Xem các dự án công khai
                  </Button>

                  <CreateBoardButton mode="modal">
                    <Button
                      size="large"
                      icon={<PlusOutlined />}
                      className="h-12 px-5 rounded-xl font-semibold border border-gray-200 dark:border-neutral-800 dark:text-gray-300 hover:border-blue-500 active:scale-95 transition-all text-sm"
                    >
                      Tạo thủ công
                    </Button>
                  </CreateBoardButton>

                  <Link href={ROUTES.LOGIN}>
                    <Button
                      size="large"
                      icon={<LogIn size={18} className="inline mr-1" />}
                      className="h-12 px-5 rounded-xl font-semibold border border-gray-300 dark:border-neutral-700 dark:text-gray-200 hover:border-blue-500 active:scale-95 transition-all text-sm"
                    >
                      Đăng nhập ngay
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Globe size={17} className="shrink-0 text-blue-500" />
                    <span>Đang hiển thị danh sách dự án cộng tác tiêu biểu công khai.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="small"
                      icon={<Sparkles size={14} className="text-yellow-400 inline" />}
                      onClick={() => setForceAiOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none text-white rounded-lg text-xs font-semibold px-2.5 h-7 shadow-sm"
                    >
                      Tạo với AI
                    </Button>
                    <Button
                      size="small"
                      type="text"
                      icon={<EyeOff size={15} />}
                      onClick={handleTogglePublicProjects}
                      className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-xs font-semibold px-2.5 h-7"
                    >
                      Ẩn danh sách
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className={cn(
                    "grid gap-4",
                    gridCols === 1 && "grid-cols-1",
                    gridCols === 2 && "grid-cols-1 md:grid-cols-2",
                    gridCols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  )}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-[280px] w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800" />
                    ))}
                  </div>
                ) : projects.length > 0 ? (
                  <div className={cn(
                    "grid gap-4",
                    gridCols === 1 && "grid-cols-1",
                    gridCols === 2 && "grid-cols-1 md:grid-cols-2",
                    gridCols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  )}>
                    {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} gridCols={gridCols} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500 text-sm">
                    Hiện chưa có dự án công khai nào.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* TRƯỜNG HỢP 2: NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP */
          loading && projects.length === 0 ? (
            <div className={cn(
              "grid gap-4",
              gridCols === 1 && "grid-cols-1",
              gridCols === 2 && "grid-cols-1 md:grid-cols-2",
              gridCols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-[280px] w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {projects.length > 0 ? (
                <div className={cn(
                  "grid gap-4",
                  gridCols === 1 && "grid-cols-1",
                  gridCols === 2 && "grid-cols-1 md:grid-cols-2",
                  gridCols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                )}>
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} gridCols={gridCols} />
                  ))}
                </div>
              ) : (
                <Card padding="large" className="flex flex-col items-center justify-center py-20 text-center dark:bg-neutral-950 dark:border-neutral-800 border-dashed animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                    <FolderPlus className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Bắt đầu dự án đầu tiên</h3>
                  <p className="text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto mb-8">
                    Bạn chưa có dự án nào. Hãy để AI giúp bạn xây dựng một không gian làm việc chuyên nghiệp chỉ trong vài giây.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      type="primary"
                      size="large"
                      icon={<Sparkles size={16} className="inline mr-1" />}
                      onClick={() => setForceAiOpen(true)}
                      className="rounded-xl h-12 px-6 font-bold shadow-xl shadow-blue-500/30 bg-gradient-to-r from-blue-600 to-indigo-600 border-none text-white active:scale-95 transition-all"
                    >
                      Tạo bằng AI (Khuyên dùng)
                    </Button>
                    <CreateBoardButton mode="modal" forceAiOpen={forceAiOpen} onAiClose={() => setForceAiOpen(false)}>
                      <Button
                        size="large"
                        icon={<PlusOutlined />}
                        className="rounded-xl h-12 px-6 font-bold border-gray-300 dark:border-neutral-700 dark:text-gray-200 hover:border-blue-500 active:scale-95 transition-all"
                      >
                        Tạo ngay bây giờ
                      </Button>
                    </CreateBoardButton>
                  </div>
                </Card>
              )}

              {total > pageSize && (
                <PremiumPagination
                  current={currentPage}
                  total={total}
                  pageSize={pageSize}
                  onChange={setCurrentPage}
                />
              )}
            </div>
          )
        )}
      </div>

      {/* Modal Popup Chào Mừng Khi Chưa Có Dự Án Nào */}
      <Modal
        open={showFirstProjectModal}
        onCancel={() => setShowFirstProjectModal(false)}
        footer={null}
        width={480}
        centered
        className="welcome-first-project-modal"
        styles={{ 
          content: { backgroundColor: 'transparent', boxShadow: 'none', padding: 0 },
          body: { padding: 0, overflow: 'hidden' }
        }}
      >
        <div className="relative bg-white dark:bg-[#151620] rounded-[28px] border border-gray-200 dark:border-neutral-800 shadow-2xl overflow-hidden p-6 sm:p-7 text-center">
          <div className="h-1.5 absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
          
          <button
            onClick={() => setShowFirstProjectModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>

          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/10 mb-4 mt-2">
            <Sparkles size={30} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 mb-2">
            Khởi Tạo Không Gian
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            Bắt đầu dự án đầu tiên
          </h3>

          <p className="text-sm text-gray-500 dark:text-neutral-400 max-w-sm mx-auto mb-6 leading-relaxed">
            Bạn chưa có dự án nào. Hãy để AI giúp bạn xây dựng một không gian làm việc chuyên nghiệp chỉ trong vài giây.
          </p>

          <div className="space-y-2.5">
            <Button
              type="primary"
              size="large"
              block
              icon={<Sparkles size={16} className="inline mr-1" />}
              onClick={() => {
                setShowFirstProjectModal(false);
                setForceAiOpen(true);
              }}
              className="h-12 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-xl shadow-blue-500/25 text-white active:scale-95 transition-all"
            >
              Tạo dự án bây giờ (AI)
            </Button>

            <CreateBoardButton mode="modal">
              <button
                onClick={() => setShowFirstProjectModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-neutral-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-900 active:scale-95 transition-all"
              >
                Tạo dự án thủ công
              </button>
            </CreateBoardButton>

            <button
              onClick={() => setShowFirstProjectModal(false)}
              className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors pt-1"
            >
              Để sau
            </button>
          </div>
        </div>
      </Modal>

      <Tour
        open={tourOpen}
        onClose={handleTourClose}
        steps={tourSteps}
        indicatorsRender={(current, total) => (
          <span className="text-xs font-bold text-blue-500">
            {current + 1} / {total}
          </span>
        )}
      />

      <style jsx global>{`
        .custom-tour-title {
          font-weight: 800;
          color: #1d4ed8;
        }
      `}</style>
    </SiteLayout>
  );
}
