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

  const pageSize = 6;
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
      title={
        <div className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
          <ProjectOutlined className="text-blue-500" />
          <span>Switch Project</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      rootClassName="project-switch-modal" // ✅ dùng cái này thay className
      styles={{
        mask: {
          backdropFilter: "blur(8px)",
          backgroundColor:
            theme === "dark"
              ? "rgba(0,0,0,0.6)"
              : "rgba(0,0,0,0.4)",
        },
      }}
    >
      <div className="space-y-6">
        {/* SEARCH */}
        <Input
          placeholder="Search projects..."
          prefix={
            <SearchOutlined className="text-blue-400 group-focus-within:text-blue-600" />
          }
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="
            rounded-2xl h-12 border-gray-200 dark:border-neutral-800 
            bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md
            text-gray-800 dark:text-gray-100
          "
        />

        {/* LOADING */}
        {loading ? (
          <div className="flex flex-col gap-4 py-4">
            {[...Array(pageSize)].map((_, i) => (
              <div
                key={i}
                className="h-20 w-full animate-pulse bg-gray-100 dark:bg-neutral-800 rounded-2xl"
              />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <>
            {/* LIST */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                {[...Array(pageSize)].map((_, i) => (
                  <div
                    key={i}
                    className="h-40 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800"
                  />
                ))}
              </div>
            ) : projects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      onClick={() => handleProjectClick(project.id)}
                      showMembers={false}
                      className="!shadow-none hover:!shadow-lg"
                    />
                  ))}
                </div>

                {/* PAGINATION */}
                {totalProjects > pageSize && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={totalProjects}
                      onChange={(page) => setCurrentPage(page)}
                      showSizeChanger={false}
                      className="project-pagination"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center text-gray-400 dark:text-gray-500">
                <Empty description={`No projects found`} />
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center text-gray-400 dark:text-gray-500">
            <Empty description={`No projects found`} />
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