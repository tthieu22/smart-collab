"use client";

import React, { useState, useEffect } from "react";
import { Modal, Input, Pagination, Empty } from "antd";
import { SearchOutlined, ProjectOutlined, SwitcherOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { projectService } from "@smart/services/project.service";
import type { Project } from "@smart/types/project";
import { projectStore } from "@smart/store/project";
import { useBoardStore } from "@smart/store/setting";
import ProjectCard from "./ProjectCard";

interface ProjectSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectSwitchModal({ isOpen, onClose }: ProjectSwitchModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);

  const pageSize = 12;
  const router = useRouter();
  const theme = useBoardStore((s) => s.theme); // ✅ lấy theme

  useEffect(() => {
    if (isOpen) {
      loadProjects(currentPage, searchQuery);
    }
  }, [isOpen, currentPage, searchQuery]);

  const loadProjects = async (page: number, query: string) => {
    setLoading(true);
    try {
      const res: any = await projectService.getAllProjects({
        page,
        limit: pageSize,
        search: query,
      });

      if (res.success && Array.isArray(res.data?.items)) {
        setProjects(res.data.items);
        setTotalProjects(res.data.total);

        const st = projectStore.getState();
        res.data.items.forEach((p: Project) => st.addProject(p));
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
    onClose();
  };

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      rootClassName="project-switch-modal"
      styles={{
        body: { padding: 0 },
        mask: {
          backdropFilter: "blur(8px)",
          backgroundColor: theme === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)",
        },
      }}
    >
      <div className={`flex flex-col h-[650px] overflow-hidden rounded-2xl bg-white dark:bg-[#0b1220]`}>
        {/* HEADER - Standardized */}
        <div className={`
          flex-none px-6 h-16 flex items-center justify-between border-b
          dark:bg-[#1e1f22] dark:border-white/5 bg-white border-gray-100
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              dark:bg-blue-500/10 dark:text-blue-400 bg-blue-50 text-blue-600
            `}>
              <SwitcherOutlined className="text-xl" />
            </div>
            <div>
              <h1 className={`text-lg font-bold tracking-tight m-0 dark:text-gray-100 text-gray-800`}>
                Du hành Thiên hà
              </h1>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium m-0">
                Chọn dự án bạn muốn truy cập nhanh
              </p>
            </div>
          </div>

          <Input
            placeholder="Tìm kiếm tọa độ thiên hà..."
            prefix={<SearchOutlined className="opacity-40" />}
            size="large"
            className="w-72 bg-neutral-100 dark:bg-white/5 border-none rounded-xl h-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(pageSize)].map((_, i) => (
                <div
                  key={i}
                  className="h-44 w-full animate-pulse bg-neutral-100 dark:bg-white/5 rounded-[24px]"
                />
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project.id)}
                  showMembers={false}
                  disablePrefetch={true}
                  className="hover:scale-[1.03] transition-transform duration-300 shadow-none border-neutral-100 dark:border-white/5"
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400">
              <Empty description={<span className="text-neutral-500 font-medium">Không tìm thấy dự án nào</span>} />
            </div>
          )}
        </div>

        {/* FOOTER / PAGINATION */}
        {totalProjects > pageSize && (
          <div className="flex-none p-5 border-t dark:border-white/5 flex justify-center bg-neutral-50/50 dark:bg-black/10">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalProjects}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              className="project-pagination"
              size="default"
            />
          </div>
        )}
      </div>

      {/* FIX PAGINATION DARK */}
      <style jsx global>{`
        .dark .project-pagination .ant-pagination-item {
          background: transparent !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .dark .project-pagination .ant-pagination-item a {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .dark .project-pagination .ant-pagination-item-active {
          border-color: #3b82f6 !important;
        }
        .dark .project-pagination .ant-pagination-item-active a {
          color: #3b82f6 !important;
        }
      `}</style>
    </Modal>
  );
}