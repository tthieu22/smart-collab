import { Logo } from './Logo';
import { Navbar } from './Navbar';
import { UserMenu } from './userMenu/UserMenu';

export default function Header() {
  return (
    <header
      className="flex items-center justify-between px-6 py-3 shadow border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      style={{ paddingLeft: 24, paddingRight: 24 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "4px 8px",
          border: "1px solid var(--border-color)",
          borderRadius: 8,
        }}
      >
        <Logo />
        <Navbar />
      </div>
      <UserMenu />
    </header>
  );
}

// Xuất lại để dễ import
export { Logo, Navbar, UserMenu };
