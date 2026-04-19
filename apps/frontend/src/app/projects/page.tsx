'use client';

import { useEffect, useState } from 'react';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import type { Project } from '@smart/types/project';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import { useHomeFeedBootstrap } from '@smart/hooks/useHomeFeed';
import { Pagination } from 'antd';
import ProjectCard from '@smart/components/project/ProjectCard';

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useHomeFeedBootstrap();

  useEffect(() => {
    projectStore.getState().setActiveProjectId(null);
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

  return (
    <SiteLayout leftSidebar={<LeftWidgets />} hideRightSidebar hideFooter>
      <div className="mx-auto w-full max-w-[1200px] space-y-8 px-4 py-6">
        {/* HEADER */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Dự án của bạn
            </h1>
            <p className="mt-1 text-gray-500 dark:text-neutral-400">
              Quản lý và theo dõi tiến độ công việc trong các không gian cộng tác.
            </p>
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
          <>
            {/* GRID LIST */}
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 text-6xl opacity-20">📁</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chưa có dự án nào</h3>
                <p className="text-gray-500 dark:text-neutral-400">Bạn chưa tham gia vào dự án nào. Hãy tạo mới hoặc yêu cầu lời mời!</p>
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
          </>
        )}
      </div>

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
      `}</style>
    </SiteLayout>
  );
}
