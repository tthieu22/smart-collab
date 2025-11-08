import CreateBoardButton from './CreateBoardButton';
import { Logo } from './Logo';
import { Navbar } from './Navbar';
import { Search } from './Search';
import { UserMenu } from './userMenu/UserMenu';

export default function Header() {
  
  return (
    <header className="flex items-center justify-between bg-white dark:bg-black px-2 shadow dark:border-gray-800 dark:border-b relative z-50">
      <div className="flex items-center gap-6 p-1">
        <Logo />
        <Navbar />
      </div>

      <div className="flex items-center gap-5">
        <Search />
        <CreateBoardButton />
      </div>

      <UserMenu />
    </header>
  );
}

// Xuất lại để dễ import
export { Logo, Navbar, UserMenu };
