'use client';

import Link from 'next/link';
export default function Sidebar() {
  return (
    <aside className="w-full">
      <h2 className="mb-3 text-base font-semibold">Menu</h2>
      <nav className="flex flex-col gap-1 text-sm">
        <Link href="/" className="rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">
          Bảng tin
        </Link>
        <Link href="/profile" className="rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">
          Trang cá nhân
        </Link>
        <Link href="/projects" className="rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">
          Dự án
        </Link>
        <Link href="/news" className="rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">
          Tin tuc
        </Link>
        <Link href="/admin/ai-auto-post" className="rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">
          AI Auto Post (test)
        </Link>
      </nav>
    </aside>
  );
}
