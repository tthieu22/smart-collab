'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card } from '@smart/components/ui/card';
import { cn } from '@smart/lib/utils';
import { useFeedStore } from '@smart/store/feed';

function Item({
  href,
  label,
  sub,
  active,
  className,
}: {
  href: string;
  label: string;
  sub?: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center justify-between rounded-lg px-3 py-2 transition',
        active
          ? 'bg-gray-100 font-semibold text-gray-900 dark:bg-neutral-800 dark:text-gray-100'
          : 'hover:bg-gray-50 text-gray-700 dark:hover:bg-neutral-900 dark:text-gray-200',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="font-medium truncate">{label}</div>
        {sub ? <div className="text-xs text-gray-500 truncate">{sub}</div> : null}
      </div>
      <div className="text-xs text-gray-400">›</div>
    </Link>
  );
}

export default function LeftWidgets() {
  const me = useFeedStore((s) => (s.currentUserId ? s.users[s.currentUserId] : null));
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isProjects = pathname === '/projects' || pathname.startsWith('/projects/');
  const isNews = pathname === '/news' || pathname.startsWith('/news/');

  return (
    <>
      <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
        <Link href={me?.id ? `/profile/${me.id}` : '/profile'} className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800">
            {me?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.avatarUrl} alt={me.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{me?.name || 'Bạn'}</div>
            <div className="text-xs text-gray-500 truncate">@{me?.username || 'me'}</div>
          </div>
        </Link>
      </Card>

      <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
        <div className="text-sm font-semibold mb-2">Khám phá</div>
        <div className="space-y-1">
          <Item href="/" label="Bảng tin" sub="Feed kiểu Facebook" active={isHome} />
          <Item
            href="/projects"
            label="Dự án"
            sub="Boards / Inbox / Calendar"
            active={isProjects}
          />
          <Item
            href="/news"
            label="Tin tức"
            sub="Bản tin AI & mẹo"
            active={isNews}
          />
        </div>
      </Card>
    </>
  );
}

