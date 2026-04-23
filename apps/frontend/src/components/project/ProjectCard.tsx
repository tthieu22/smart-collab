'use client';

import React from 'react';
import Link from 'next/link';
import type { Project } from '@smart/types/project';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  className?: string;
  showMembers?: boolean;
  gridCols?: 1 | 2 | 3;
}

export default function ProjectCard({
  project,
  onClick,
  className = "",
  showMembers = true,
  gridCols = 3
}: ProjectCardProps) {
  const bgStyle: React.CSSProperties = project.fileUrl
    ? { backgroundImage: `url(${project.fileUrl})` }
    : project.background
      ? { backgroundImage: `url(${project.background})` }
      : project.color
        ? { backgroundColor: project.color }
        : { backgroundImage: 'url(/backgrounds/muaxuan.png)' };

  const isList = gridCols === 1;

  const content = (
    <div className={`group flex overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 isolation-auto z-0 ${isList ? 'flex-row h-56' : 'flex-col'
      } ${className}`}>
      {/* BACKGROUND IMAGE / COLOR CONTAINER */}
      <div
        className={`relative overflow-hidden z-0 ${isList ? 'w-1/3 h-full shrink-0 rounded-l-[24px]' : 'h-40 w-full rounded-t-[24px]'
          }`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={bgStyle}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {project.visibility && (
          <span className="absolute left-4 top-4 rounded-xl bg-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md shadow-sm border border-white/20">
            {project.visibility}
          </span>
        )}
      </div>

      {/* PROJECT INFO */}
      <div className={`flex flex-1 flex-col justify-between ${isList ? 'p-8' : 'p-6'}`}>
        <div className="min-w-0">
          <h3 className={`mb-2 truncate font-bold capitalize text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors tracking-tight ${isList ? 'text-xl' : gridCols === 2 ? 'text-lg' : 'text-base'
            }`}>
            {project.name}
          </h3>
          {project.description && (
            <p className={`text-gray-500 dark:text-neutral-400 font-medium ${isList ? 'line-clamp-3 text-base leading-relaxed' : 'line-clamp-2 text-sm'
              }`}>
              {project.description}
            </p>
          )}
        </div>

        {showMembers && (
          <div className={`mt-4 flex items-center justify-between border-t border-gray-50 pt-4 dark:border-neutral-800/50 ${isList ? 'hidden md:flex' : ''}`}>
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2.5">
                {[...Array(Math.min(project.members?.length || 0, 4))].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 dark:border-neutral-900 dark:bg-neutral-800 ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all"
                  />
                ))}
                {(project.members?.length || 0) > 4 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-50 text-[10px] font-black text-blue-600 dark:border-neutral-900 dark:bg-blue-900/30 dark:text-blue-400">
                    +{(project.members?.length || 0) - 4}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
                {project.members?.length || 0} Thành viên
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        {content}
      </div>
    );
  }

  return (
    <Link href={`/projects/${project.id}`} className="block">
      {content}
    </Link>
  );
}
