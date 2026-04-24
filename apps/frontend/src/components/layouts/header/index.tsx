'use client';

import { usePathname } from 'next/navigation';
import CreateBoardButton from './CreateBoardButton';
import { Logo } from './Logo';
import { Navbar } from './Navbar';
import { Search } from './Search';
import { UserMenu } from './userMenu/UserMenu';
import { ThemeToggle } from '@smart/components/ui/ThemeToggle';
import { cn } from '@smart/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const isProjectsPage = pathname === '/projects';

  return (
    <header className="h-14 border-b border-gray-200/60 bg-white/80 px-4 backdrop-blur-lg dark:border-neutral-800/60 dark:bg-black/80">
      <div className="relative mx-auto flex h-full items-center justify-between max-w-[1800px]">
        
        {/* LEFT: Logo & Nav */}
        <div className="flex items-center gap-4 z-10">
          <Logo />
          <div className="hidden lg:block ml-2">
            <Navbar />
          </div>
        </div>

        {/* CENTER: Search & Create (Perfectly Centered) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 w-full max-w-[40%] justify-center px-4">
          <div className="w-full max-w-sm hidden sm:block">
            <Search />
          </div>
          <div className="flex-shrink-0">
            {!isProjectsPage && <CreateBoardButton />}
          </div>
        </div>

        {/* RIGHT: Theme & User */}
        <div className="flex items-center gap-3 z-10">
          <div className="hidden xs:block">
            <ThemeToggle />
          </div>
          <UserMenu />
        </div>

      </div>
    </header>
  );
}

export { Logo, Navbar, UserMenu };
