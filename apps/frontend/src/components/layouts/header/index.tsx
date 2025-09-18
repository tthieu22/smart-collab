import { Logo } from './Logo';
import { Navbar } from './Navbar';
import { UserMenu } from './UserMenu';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 shadow">
      <Logo />
      <Navbar />
      <UserMenu />
    </header>
  );
}

export { Logo, Navbar, UserMenu };
