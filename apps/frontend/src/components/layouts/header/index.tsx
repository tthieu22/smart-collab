import { usePathname } from 'next/navigation';
import CreateBoardButton from './CreateBoardButton';
import { Logo } from './Logo';
import { Navbar } from './Navbar';
import { Search } from './Search';
import { UserMenu } from './userMenu/UserMenu';

export default function Header() {
  const pathname = usePathname();
  const isProjectsPage = pathname === '/projects';
  
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white/90 px-2 backdrop-blur dark:border-neutral-800 dark:bg-black/80 relative z-50">
      <div className="flex items-center gap-6 p-1">
        <Logo />
        <Navbar />
      </div>

      <div className="flex items-center gap-5">
        <Search />
        {!isProjectsPage && <CreateBoardButton />}
      </div>

      <UserMenu />
    </header>
  );
}

// Xuất lại để dễ import
export { Logo, Navbar, UserMenu };
