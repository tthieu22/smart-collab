'use client';

import React from 'react';
import Link from 'next/link';
import type { Project } from '@smart/types/project';

import { projectStore } from '@smart/store/project';
import { cn } from '@smart/lib/utils';
import { UI_CONFIG } from '@smart/lib/constants';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  className?: string;
  showMembers?: boolean;
  gridCols?: 1 | 2 | 3;
  disablePrefetch?: boolean;
}

export default function ProjectCard({
  project,
  onClick,
  className = "",
  showMembers = true,
  gridCols = 3,
  disablePrefetch = false
}: ProjectCardProps) {
  const prefetchProject = projectStore((s) => s.prefetchProject);

  const bgStyle: React.CSSProperties = project.fileUrl
    ? { backgroundImage: `url(${project.fileUrl})` }
    : project.background
      ? { backgroundImage: `url(${project.background})` }
      : project.color
        ? { backgroundColor: project.color }
        : { backgroundImage: 'url(/backgrounds/muaxuan.png)' };

  const isList = gridCols === 1;

  const content = (
    <div
      onMouseEnter={() => !disablePrefetch && prefetchProject(project.id)}
      className={cn(
        "group relative flex overflow-hidden",
        UI_CONFIG.CARD.RADIUS,
        UI_CONFIG.CARD.BORDER,
        UI_CONFIG.CARD.BG,
        UI_CONFIG.CARD.SHADOW,
        isList ? "flex-col md:flex-row md:min-h-[220px]" : "flex-col h-full"
      )}
    >
      {/* BACKGROUND IMAGE / COLOR CONTAINER */}
      <div
        className={cn(
          "relative overflow-hidden z-0 shrink-0",
          isList ? "w-full md:w-1/3 h-48 md:h-auto" : "h-40 w-full"
        )}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
          style={bgStyle}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
        
        {project.visibility && (
          <span className="absolute left-4 top-4 rounded-xl bg-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md shadow-lg border border-white/20">
            {project.visibility}
          </span>
        )}
      </div>

      {/* PROJECT INFO */}
      <div className={cn(
        "flex flex-1 flex-col justify-between",
        isList ? UI_CONFIG.CARD.LIST_PADDING : UI_CONFIG.CARD.PADDING
      )}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
             <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Active Project</span>
          </div>
          
          <h3 className={cn(
            "font-black capitalize text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 tracking-tight",
            isList ? "text-xl md:text-2xl mb-3" : "text-lg mb-2"
          )}>
            {project.name}
          </h3>
          
          {project.description && (
            <p className={cn(
              "text-gray-500 dark:text-neutral-400 font-medium leading-relaxed",
              isList ? "line-clamp-3 text-[15px]" : "line-clamp-2 text-sm"
            )}>
              {project.description}
            </p>
          )}
        </div>

        {showMembers && (
          <div className={cn(
            "mt-6 flex items-center justify-between border-t border-gray-50 pt-5 dark:border-neutral-800/50",
            !isList && "mt-auto"
          )}>
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2.5">
                {[...Array(Math.min(project.members?.length || 0, 4))].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 dark:border-neutral-900 dark:bg-neutral-800 ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all shadow-sm"
                  />
                ))}
                {(project.members?.length || 0) > 4 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-50 text-[10px] font-black text-blue-600 dark:border-neutral-900 dark:bg-blue-900/30 dark:text-blue-400">
                    +{(project.members?.length || 0) - 4}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
                {project.members?.length || 0} Members
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-500">
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Open</span>
               <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  →
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} onMouseEnter={() => !disablePrefetch && prefetchProject(project.id)} className="cursor-pointer">
        {content}
      </div>
    );
  }

  return (
    <Link href={`/projects/${project.id}`} prefetch className="block">
      {content}
    </Link>
  );
}
