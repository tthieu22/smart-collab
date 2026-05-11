'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Command,
  Bell,
  ChevronRight,
  Zap,
  Menu,
  Search as SearchIcon
} from 'lucide-react';
import { Drawer, Modal } from 'antd';
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
import { useAIStore } from '@smart/store/ai';
import { AIChatWindow } from '../../shared/AIChatWindow';

export default function Header() {
  const pathname = usePathname();
  const isProjectsPage = pathname === '/projects';
  const currentProject = projectStore((state) => state.currentProject);
  const posts = useFeedStore((state) => state.posts);
  const usersFromFeed = useFeedStore((state) => state.users);
  const { currentUser, allUsers } = useUserStore();
  const { articles: newsArticles } = useNewsAdminStore();
  const { toggleAIChat } = useAIStore();

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);

  const [currentTime, setCurrentTime] = React.useState<string>('');
  const [currentDate, setCurrentDate] = React.useState<string>('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));

      const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const dayName = dayNames[now.getDay()];
      const day = now.getDate();
      const month = now.getMonth() + 1;
      setCurrentDate(`${dayName}, ${day} tháng ${month}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

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
        const userFromFeed = usersFromFeed[segment];
        if (userFromFeed) {
          label = userFromFeed.name;
        } else {
          const userObj = currentUser?.id === segment ? currentUser : allUsers.find(u => u.id === segment);
          if (userObj) {
            const fullName = `${userObj.firstName ?? ''} ${userObj.lastName ?? ''}`.trim();
            label = fullName || userObj.email;
          }
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
    <header className="sticky top-0 z-[100] h-14 sm:h-16 border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.03)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.02)]">
      <div className="relative flex h-full items-center justify-between w-full px-3 sm:px-6 lg:px-8 max-w-none gap-2">

        {/* LEFT: Branding & Dynamic Navigation */}
        <div className="flex items-center gap-2 sm:gap-6">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-500 transition-colors"
          >
            <Menu size={20} />
          </button>
          <Logo />

          <div className="hidden lg:flex items-center gap-4">
            <div className="h-6 w-px bg-gray-200 dark:bg-neutral-800" />
            <Navbar />
          </div>

          <div className="hidden xl:flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
            <span className="hover:text-blue-500 cursor-pointer transition-colors px-1 truncate max-w-[120px]">
              {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Home'}
            </span>
          </div>
        </div>

        {/* CENTER: Smart Search & Commander */}
        <div className="flex-1 max-w-xl mx-1 sm:mx-8 flex items-center justify-end lg:justify-center gap-2 sm:gap-3">
          {/* Desktop Search */}
          <div className="hidden lg:block relative w-full group">
            <Search />
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
              <Command size={10} />
              <span className="text-[10px] font-bold">K</span>
            </div>
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="flex lg:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-500 transition-all active:scale-90"
          >
            <SearchIcon size={20} />
          </button>

          <div className="hidden sm:block flex-shrink-0">
            {!isProjectsPage && <CreateBoardButton />}
          </div>
        </div>

        {/* RIGHT: Intelligence & User Controls */}
        <div className="flex items-center gap-3">
          {/* Clock & Date */}
          <div className="hidden xl:flex flex-col items-end mr-2 leading-none">
            <span className="text-sm font-black tracking-tighter text-gray-900 dark:text-white">{currentTime}</span>
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">{currentDate}</span>
          </div>

          <div className="hidden lg:flex h-6 w-px bg-gray-200 dark:bg-neutral-800 mx-1" />
          
          {/* Smart AI Indicator (Desktop) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleAIChat}
            className="hidden lg:flex relative p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            <Sparkles size={18} className="relative z-10 animate-pulse" />
          </motion.button>

          <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-neutral-800 mx-1" />

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <UserMenu />
          </div>
        </div>


        <Drawer
          title={
            <div className="flex items-center gap-2">
              <Logo />
            </div>
          }
          placement="left"
          onClose={() => setIsDrawerOpen(false)}
          open={isDrawerOpen}
          width={280}
          styles={{ 
            body: { padding: '16px' },
            header: { borderBottom: '1px solid rgba(0,0,0,0.05)' }
          }}
          className="dark:bg-neutral-950"
        >
          <div className="flex flex-col gap-4">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Điều hướng</div>
            <div className="flex flex-col gap-2" onClick={() => setIsDrawerOpen(false)}>
              <Navbar vertical={true} />
            </div>
            
            <div className="h-px bg-gray-100 dark:bg-neutral-800 my-4" />
            
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hành động nhanh</div>
            <div className="flex flex-col gap-3">
              {!isProjectsPage && (
                <div onClick={() => setIsDrawerOpen(false)}>
                  <CreateBoardButton />
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Chế độ giao diện</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </Drawer>

        {/* Mobile Search Modal */}
        <Modal
          open={isMobileSearchOpen}
          onCancel={() => setIsMobileSearchOpen(false)}
          footer={null}
          closable={false}
          centered
          width="100%"
          className="mobile-search-modal"
          styles={{
            content: {
              padding: '12px',
              borderRadius: '24px',
              backgroundColor: 'transparent',
              boxShadow: 'none'
            },
            mask: {
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0,0,0,0.6)'
            }
          }}
        >
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] ml-2">Tìm kiếm dữ liệu</span>
              <button 
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <Search 
              placeholder="Nhập từ khóa tìm kiếm..." 
              onResultClick={() => setIsMobileSearchOpen(false)}
            />
          </div>
        </Modal>

      </div>
    </header>
  );
}


export { Logo, Navbar, UserMenu };
