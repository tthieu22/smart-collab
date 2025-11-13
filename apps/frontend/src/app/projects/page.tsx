'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import type { Project } from '@smart/types/project';
import { Loading } from '@smart/components/ui/loading';
import { Sidebar } from '@smart/components/layouts';

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res: any = await projectService.getAllProjects();

        if (res.success && Array.isArray(res.data)) {
          const list: Project[] = res.data;
          const st = projectStore.getState();
          list.forEach((p) => st.addProject(p));
          if (mounted) {
            setProjects(list);
          }
        } else {
          console.error('Load projects failed:', res.message || 'Unknown error');
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Loading text="Đang tải dữ liệu" />;

  return (
    <div className="flex overflow-hidden min-h-screen">
      <div className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Your Workspaces
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {projects.map((project) => {
            const bgStyle: React.CSSProperties = project.fileUrl
              ? { backgroundImage: `url(${project.fileUrl})` }
              : project.background
              ? { backgroundImage: `url(${project.background})` }
              : project.color
              ? { backgroundColor: project.color }
              : { backgroundImage: 'url(/backgrounds/muaxuan.png)' };

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex flex-col rounded-xl shadow-md hover:shadow-2xl transition transform overflow-hidden bg-white dark:bg-gray-800"
              >
                <div
                  className="h-40 w-full bg-cover bg-center relative"
                  style={bgStyle}
                >
                  <div className="absolute inset-0 bg-black/20"></div>
                  {project.visibility && (
                    <span className="absolute top-2 left-2 flex items-center justify-center bg-blue-700 dark:bg-blue-900 text-white text-xs px-2 py-0.5 rounded-md shadow">
                      {project.visibility.charAt(0).toUpperCase() +
                        project.visibility.slice(1)}
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate capitalize">
                    {project.name}
                  </h3>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 capitalize">
                    <p className="font-medium">
                      Members: {project.members?.length || 0}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
