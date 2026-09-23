'use client';

import Link from 'next/link';
export default function Sidebar() {
  return (
    <aside className="w-full">
      <h2 className="mb-3 text-base font-semibold">Menu</h2>
      <nav className="flex flex-col gap-1 text-sm">
        <Link href="/" prefetch className="rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">
          Bảng Tin
        </Link>
        <Link href="/profile" prefetch className="rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">
          Hồ Sơ Cá Nhân
        </Link>
        <Link href="/projects" prefetch className="rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">
          Dự Án
        </Link>
        <Link href="/news" prefetch className="rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">
          Tin Tức
        </Link>
        <Link href="/admin/ai-auto-post" prefetch className="rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">
          AI Auto Post (test)
        </Link>
      </nav>
    </aside>
  );
}
