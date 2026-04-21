'use client';

import { useEffect, useState, useRef } from 'react';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import type { Project } from '@smart/types/project';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import { useHomeFeedBootstrap } from '@smart/hooks/useHomeFeed';
import { Pagination, Button, Tour, type TourProps, Space, Typography, Card } from 'antd';
import ProjectCard from '@smart/components/project/ProjectCard';
import CreateBoardButton from '@smart/components/layouts/header/CreateBoardButton';
import { PlusOutlined, RobotOutlined, RocketOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Tour refs
  const headerRef = useRef(null);
  const createBtnRef = useRef(null);
  const aiInfoRef = useRef(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [forceAiOpen, setForceAiOpen] = useState(false);

  useHomeFeedBootstrap();

  const handleTourClose = () => {
    setTourOpen(false);
    // Trigger AI modal after tour ends
    setForceAiOpen(true);
  };

  useEffect(() => {
    projectStore.getState().setActiveProjectId(null);
    
    // Check if first time visiting
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

  return (
    <SiteLayout leftSidebar={<LeftWidgets />} hideRightSidebar hideFooter>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
        {/* STICKY HEADER */}
        <div 
          className="sticky top-0 z-20 bg-gray-50/80 dark:bg-neutral-950/80 backdrop-blur-md py-4 mb-8 border-b border-gray-200 dark:border-neutral-800 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center transition-all duration-300"
          ref={headerRef}
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Dự án của bạn
            </h1>
            <p className="mt-1 text-gray-500 dark:text-neutral-400">
              Quản lý và theo dõi tiến độ công việc trong các không gian cộng tác.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              icon={<InfoCircleOutlined />} 
              onClick={() => setTourOpen(true)}
              className="dark:bg-neutral-900 dark:border-neutral-800"
            >
              Hướng dẫn
            </Button>
            
            <div ref={createBtnRef}>
              <CreateBoardButton forceAiOpen={forceAiOpen} onAiClose={() => setForceAiOpen(false)}>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<PlusOutlined />} 
                  className="rounded-xl shadow-lg shadow-blue-500/20 h-12 px-6 font-bold flex items-center gap-2"
                >
                  Tạo dự án mới
                </Button>
              </CreateBoardButton>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(pageSize)].map((_, i) => (
              <div key={i} className="h-[280px] w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* GRID LIST */}
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-neutral-900 rounded-[32px] border border-dashed border-gray-200 dark:border-neutral-800 shadow-sm animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                  <RocketOutlined className="text-4xl text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Bắt đầu dự án đầu tiên</h3>
                <p className="text-gray-500 dark:text-neutral-400 max-w-md mx-auto mb-8">
                  Bạn chưa có dự án nào. Hãy để AI giúp bạn xây dựng một không gian làm việc chuyên nghiệp chỉ trong vài giây.
                </p>
                <Space size="middle">
                  <CreateBoardButton forceAiOpen={forceAiOpen} onAiClose={() => setForceAiOpen(false)}>
                    <Button 
                      type="primary" 
                      size="large"
                      icon={<PlusOutlined />} 
                      className="rounded-xl h-14 px-8 font-bold text-lg shadow-xl shadow-blue-500/30"
                    >
                      Tạo ngay bây giờ
                    </Button>
                  </CreateBoardButton>
                </Space>
              </div>
            )}

            {/* PAGINATION */}
            {total > pageSize && (
              <div className="flex justify-center pt-10">
                <Pagination
                  current={currentPage}
                  total={total}
                  pageSize={pageSize}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                  className="premium-pagination"
                />
              </div>
            )}
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
        .premium-pagination .ant-pagination-item {
          border-radius: 12px !important;
          border: 1px solid #e5e7eb !important;
          background: white !important;
          font-weight: 600 !important;
        }
        .dark .premium-pagination .ant-pagination-item {
          background: #171717 !important;
          border-color: #262626 !important;
        }
        .premium-pagination .ant-pagination-item-active {
          border-color: #3b82f6 !important;
          background: #3b82f6 !important;
        }
        .premium-pagination .ant-pagination-item-active a {
          color: white !important;
        }
        .dark .premium-pagination .ant-pagination-item a {
          color: #a3a3a3 !important;
        }
        .premium-pagination .ant-pagination-prev, 
        .premium-pagination .ant-pagination-next {
          border-radius: 12px !important;
        }
        .custom-tour-title {
          font-weight: 800;
          color: #1d4ed8;
        }
      `}</style>
    </SiteLayout>
  );
}
