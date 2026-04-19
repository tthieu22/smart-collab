'use client';

import React from 'react';
import Link from 'next/link';
import type { Project } from '@smart/types/project';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  className?: string;
  showMembers?: boolean;
}

export default function ProjectCard({ 
  project, 
  onClick, 
  className = "",
  showMembers = true 
}: ProjectCardProps) {
  const bgStyle: React.CSSProperties = project.fileUrl
    ? { backgroundImage: `url(${project.fileUrl})` }
    : project.background
      ? { backgroundImage: `url(${project.background})` }
      : project.color
        ? { backgroundColor: project.color }
        : { backgroundImage: 'url(/backgrounds/muaxuan.png)' };

  const content = (
    <div className={`group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900 ${className}`}>
      {/* BACKGROUND IMAGE / COLOR */}
      <div
        className="relative h-40 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={bgStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {project.visibility && (
          <span className="absolute left-3 top-3 rounded-lg bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm border border-white/20">
            {project.visibility}
          </span>
        )}
      </div>

      {/* PROJECT INFO */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="mb-1.5 truncate text-lg font-bold capitalize text-gray-900 dark:text-gray-100 group-hover:text-blue-500 transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="line-clamp-2 text-sm text-gray-500 dark:text-neutral-400">
              {project.description}
            </p>
          )}
        </div>

        {showMembers && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4 dark:border-neutral-800/50">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {[...Array(Math.min(project.members?.length || 0, 3))].map((_, i) => (
                  <div 
                    key={i} 
                    className="h-7 w-7 rounded-full border-2 border-white bg-gray-200 dark:border-neutral-900 dark:bg-neutral-800"
                  />
                ))}
                {(project.members?.length || 0) > 3 && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-50 text-[10px] font-bold text-blue-600 dark:border-neutral-900 dark:bg-blue-900/30 dark:text-blue-400">
                    +{(project.members?.length || 0) - 3}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">
                {project.members?.length || 0} Members
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
