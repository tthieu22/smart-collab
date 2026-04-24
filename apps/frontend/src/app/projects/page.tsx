'use client';

import { useEffect, useState, useRef } from 'react';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import type { Project } from '@smart/types/project';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { useHomeFeedBootstrap } from '@smart/hooks/useHomeFeed';
import { Button, Tour, type TourProps } from 'antd';
import { Card } from '@smart/components/ui/card';
import ProjectCard from '@smart/components/project/ProjectCard';
import CreateBoardButton from '@smart/components/layouts/header/CreateBoardButton';
import { PlusOutlined, RocketOutlined, InfoCircleOutlined, LayoutOutlined } from '@ant-design/icons';
import { LayoutGrid, Columns, Square, Info, Plus } from 'lucide-react';
import { PremiumPagination } from '@smart/components/ui/PremiumPagination';
import { PageHeader } from '@smart/components/ui/PageHeader';

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Tour refs
  const headerRef = useRef(null);
  const createBtnRef = useRef(null);
  const aiInfoRef = useRef(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [forceAiOpen, setForceAiOpen] = useState(false);

  useHomeFeedBootstrap();

  const handleTourClose = () => {
    setTourOpen(false);
    setForceAiOpen(true);
  };

  const [gridCols, setGridCols] = useState<1 | 2 | 3>(3);

  useEffect(() => {
    projectStore.getState().setActiveProjectId(null);
    const hasSeenTour = localStorage.getItem('hasSeenProjectsTour');
    if (!hasSeenTour) {
      setTourOpen(true);
      localStorage.setItem('hasSeenProjectsTour', 'true');
    }
  }, []);

  const load = async (page: number) => {
    setLoading(true);
    try {
      const res: any = await projectService.getAllProjects({
        page,
        limit: pageSize
      });

      if (res.success && res.data && Array.isArray(res.data.items)) {
        const list: Project[] = res.data.items;
        const st = projectStore.getState();
        list.forEach((p) => st.addProject(p));
        setProjects(list);
        setTotal(res.data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(currentPage);
  }, [currentPage]);

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
          className={`p-2 rounded-lg transition-all ${gridCols === 3 ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
          title="3 Columns"
        >
          <LayoutGrid size={18} />
        </button>
      </div>

      <Button
        icon={<Info size={18} />}
        onClick={() => setTourOpen(true)}
        className="dark:bg-neutral-900 dark:border-neutral-800 h-10 rounded-xl flex items-center hover:text-blue-500 border-none shadow-sm ring-1 ring-black/5 dark:ring-white/10"
      >
        Hướng dẫn
      </Button>

      <div ref={createBtnRef}>
        <CreateBoardButton forceAiOpen={forceAiOpen} onAiClose={() => setForceAiOpen(false)}>
          <Button
            type="primary"
            icon={<Plus size={20} strokeWidth={3} />}
            className="rounded-xl shadow-lg shadow-blue-500/20 h-10 px-4 font-bold flex items-center gap-2 border-none"
          >
            Tạo dự án mới
          </Button>
        </CreateBoardButton>
      </div>
    </div>
  );

  return (
    <SiteLayout hideFooter>
      <div className="mx-auto w-full max-w-5xl space-y-4 pb-10 transition-all duration-500 pt-4">
        <div ref={headerRef}>
          <PageHeader
            icon={<LayoutGrid />}
            title="Dự án của bạn"
            description="Quản lý và theo dõi tiến độ công việc trong các không gian cộng tác."
            extra={extra}
          />
        </div>

        {loading ? (
          <div className={`grid gap-4 ${gridCols === 1 ? 'grid-cols-1' : gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-[280px] w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {projects.length > 0 ? (
              <div className={`grid gap-4 ${gridCols === 1 ? 'grid-cols-1' : gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}>
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} gridCols={gridCols} />
                ))}
              </div>
            ) : (
              <Card padding="large" className="flex flex-col items-center justify-center py-20 text-center dark:bg-neutral-950 dark:border-neutral-800 border-dashed animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                  <RocketOutlined className="text-4xl text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Bắt đầu dự án đầu tiên</h3>
                <p className="text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto mb-8">
                  Bạn chưa có dự án nào. Hãy để AI giúp bạn xây dựng một không gian làm việc chuyên nghiệp chỉ trong vài giây.
                </p>
                <CreateBoardButton forceAiOpen={forceAiOpen} onAiClose={() => setForceAiOpen(false)}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    className="rounded-xl h-12 px-8 font-bold shadow-xl shadow-blue-500/30"
                  >
                    Tạo ngay bây giờ
                  </Button>
                </CreateBoardButton>
              </Card>
            )}

            <PremiumPagination
              current={currentPage}
              total={total}
              pageSize={pageSize}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </div>

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
