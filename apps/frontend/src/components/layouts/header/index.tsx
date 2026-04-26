'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Command,
  Bell,
  ChevronRight,
  Zap
} from 'lucide-react';
import CreateBoardButton from './CreateBoardButton';
import { Logo } from './Logo';
import { Navbar } from './Navbar';
import { Search } from './Search';
import { UserMenu } from './userMenu/UserMenu';
import { ThemeToggle } from '@smart/components/ui/ThemeToggle';
import { cn } from '@smart/lib/utils';
import Link from 'next/link';
import { projectStore } from '@smart/store/project';
import { useFeedStore } from '@smart/store/feed';
import { useUserStore } from '@smart/store/user';
import { useNewsAdminStore } from '@smart/store/news-admin';

export default function Header() {
  const pathname = usePathname();
  const isProjectsPage = pathname === '/projects';
  const currentProject = projectStore((state) => state.currentProject);
  const posts = useFeedStore((state) => state.posts);
  const { currentUser, allUsers } = useUserStore();
  const { articles: newsArticles } = useNewsAdminStore();

  // Breadcrumbs logic
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');

    // Static mapping for common routes
    const staticMap: Record<string, string> = {
      'feed': 'Bảng tin',
      'news': 'Tin tức',
      'projects': 'Dự án',
      'workspace': 'Workspace',
      'settings': 'Cài đặt',
      'profile': 'Trang cá nhân'
    };

    let label = staticMap[segment];

    // Dynamic lookup for IDs (Project Name, News Title, User Name)
    if (!label && index > 0) {
      const parent = pathSegments[index - 1];

      if (parent === 'projects' && currentProject?.id === segment) {
        label = currentProject.name || 'Dự án';
      } else if (parent === 'news') {
        const foundArticle = newsArticles.find(a => a.id === segment);
        if (foundArticle) {
          label = foundArticle.title || 'Chi tiết tin tức';
        } else if (posts[segment]) {
          label = posts[segment].title || 'Chi tiết tin tức';
        }
      } else if (parent === 'profile') {
        const userObj = currentUser?.id === segment ? currentUser : allUsers.find(u => u.id === segment);
        if (userObj) {
          const fullName = `${userObj.firstName ?? ''} ${userObj.lastName ?? ''}`.trim();
          label = fullName || userObj.email;
        }
      }
    }

    // Fallback to capitalized segment if no mapping found
    if (!label) {
      label = segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    return { label, href };
  });

  return (
    <header className="sticky top-0 z-[100] h-16 border-b border-gray-200/50 dark:border-white/5 bg-white dark:bg-[#030303] backdrop-blur-xl">
      <div className="relative flex h-full items-center justify-between w-full px-6 lg:px-8 max-w-none">

        {/* LEFT: Branding & Dynamic Navigation */}
        <div className="flex items-center gap-6">
          <Logo />

          <div className="hidden lg:flex items-center gap-4">
            <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
            <Navbar />
          </div>

          <div className="hidden md:flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
            <span className="hover:text-blue-500 cursor-pointer transition-colors px-1">
              {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Home'}
            </span>
          </div>
        </div>

        {/* CENTER: Smart Search & Commander */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8 items-center gap-3">
          <div className="relative w-full group">
            <Search />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
              <Command size={10} />
              <span className="text-[10px] font-bold">K</span>
            </div>
          </div>

          <div className="flex-shrink-0">
            {!isProjectsPage && <CreateBoardButton />}
          </div>
        </div>

        {/* RIGHT: Intelligence & User Controls */}
        <div className="flex items-center gap-3">
          {/* Smart AI Indicator */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            <Sparkles size={18} className="relative z-10 animate-pulse" />
          </motion.button>

          <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1" />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

      </div>
    </header>
  );
}

export { Logo, Navbar, UserMenu };
