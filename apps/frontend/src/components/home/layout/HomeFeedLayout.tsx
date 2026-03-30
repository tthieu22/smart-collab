'use client';

import { useEffect } from 'react';
import { cn } from '@smart/lib/utils';

export default function HomeFeedLayout({
  left,
  right,
  children,
  className,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    document.body.style.backgroundColor = '';
    return () => {};
  }, []);

  return (
    <div className={cn('w-full', className)}>
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="grid grid-cols-12 gap-4">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-4 space-y-4">{left}</div>
          </aside>

          <section className="col-span-12 lg:col-span-6">{children}</section>

          <aside className="hidden xl:block xl:col-span-3">
            <div className="sticky top-4 space-y-4">{right}</div>
          </aside>
        </div>
      </div>
    </div>
  );
}

