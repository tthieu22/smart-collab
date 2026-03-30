'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import type { Project } from '@smart/types/project';
import { Loading } from '@smart/components/ui/loading';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import RightWidgets from '@smart/components/home/widgets/RightWidgets';
import { useHomeFeedBootstrap } from '@smart/hooks/useHomeFeed';

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  useHomeFeedBootstrap();

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
          console.error(
            'Load projects failed:',
            res.message || 'Unknown error'
          );
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
    <SiteLayout leftSidebar={<LeftWidgets />} hideRightSidebar hideFooter>
      <div className="mx-auto w-full max-w-[980px] space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
              >
                <div
                  className="relative h-40 w-full bg-cover bg-center"
                  style={bgStyle}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  {project.visibility && (
                    <span className="absolute left-2 top-2 rounded-md bg-blue-700 px-2 py-0.5 text-xs text-white shadow dark:bg-blue-900">
                      {project.visibility.charAt(0).toUpperCase() +
                        project.visibility.slice(1)}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <h3 className="mb-2 truncate text-lg font-semibold capitalize text-gray-900 dark:text-gray-100">
                    {project.name}
                  </h3>
                  <div className="space-y-1 text-sm capitalize text-gray-700 dark:text-gray-300">
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
    </SiteLayout>
  );
}
