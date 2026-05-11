'use client';

import React from 'react';
import Link from 'next/link';
import type { Project } from '@smart/types/project';
import { projectStore } from '@smart/store/project';
import { cn } from '@smart/lib/utils';
import { UI_CONFIG } from '@smart/lib/constants';
import { useUserStore } from '@smart/store/user';
import { Tooltip } from 'antd';

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
  const currentUser = useUserStore((s) => s.currentUser);

  const bgStyle: React.CSSProperties = project.fileUrl
    ? { backgroundImage: `url(${project.fileUrl})` }
    : project.background
      ? { backgroundImage: `url(${project.background})` }
      : project.color
        ? { backgroundColor: project.color }
        : { backgroundImage: 'url(/backgrounds/muaxuan.png)' };

  const isList = gridCols === 1;

  // Determine health status color and label
  const healthConfig = {
    ON_TRACK: { color: 'text-blue-500', bg: 'bg-blue-500', label: 'On Track' },
    AT_RISK: { color: 'text-amber-500', bg: 'bg-amber-500', label: 'At Risk' },
    DELAYED: { color: 'text-red-500', bg: 'bg-red-500', label: 'Delayed' },
  } as const;

  const healthKey = ((project as any).healthStatus as keyof typeof healthConfig) || 'ON_TRACK';
  const health = healthConfig[healthKey] || healthConfig.ON_TRACK;
  const isOwner = project.ownerId === currentUser?.id;
  const myRole = isOwner ? 'Owner' : (project.members?.find(m => m.userId === currentUser?.id)?.role || 'Member');

  const content = (
    <div
      onMouseEnter={() => !disablePrefetch && prefetchProject(project.id)}
      className={cn(
        "group relative flex overflow-hidden",
        UI_CONFIG.CARD.RADIUS,
        UI_CONFIG.CARD.BORDER,
        UI_CONFIG.CARD.BG,
        UI_CONFIG.CARD.SHADOW,
        isList ? "flex-col md:flex-row md:min-h-[220px]" : "flex-col h-full",
        className
      )}
    >
      {/* BACKGROUND IMAGE / COLOR CONTAINER */}
      <div
        className={cn(
          "relative overflow-hidden z-0 shrink-0",
          isList ? "w-full md:w-[280px] h-48 md:h-auto md:min-h-[220px]" : "h-40 w-full"
        )}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
          style={bgStyle}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
        
        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {project.visibility && (
            <span className="rounded-xl bg-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md shadow-lg border border-white/20">
              {project.visibility}
            </span>
          )}
          <span className="w-fit rounded-xl bg-blue-600/40 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-md border border-white/10">
            {myRole}
          </span>
        </div>
      </div>

      {/* PROJECT INFO */}
      <div className={cn(
        "flex flex-1 flex-col justify-between",
        isList ? UI_CONFIG.CARD.LIST_PADDING : UI_CONFIG.CARD.PADDING
      )}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
             <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", health.bg)} />
             <span className={cn("text-[10px] font-black uppercase tracking-widest", health.color)}>
               {health.label}
             </span>
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
                {(project.members || []).slice(0, 4).map((member, i) => {
                  const avatar = (member as any).userAvatar || member.user?.avatar;
                  return (
                    <Tooltip key={member.id || i} title={(member as any).userName || member.user?.firstName || 'User'}>
                      <div
                        className="h-8 w-8 rounded-full border-2 border-white bg-cover bg-center bg-gray-200 dark:border-neutral-900 dark:bg-neutral-800 ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all shadow-sm"
                        style={avatar ? { backgroundImage: `url(${avatar})` } : {}}
                      />
                    </Tooltip>
                  );
                })}
                {((project as any).memberCount || 0) > 4 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-50 text-[10px] font-black text-blue-600 dark:border-neutral-900 dark:bg-blue-900/30 dark:text-blue-400">
                    +{((project as any).memberCount || 0) - 4}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
                {(project as any).memberCount || project.members?.length || 0} Members
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
