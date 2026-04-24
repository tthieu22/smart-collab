'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@smart/components/layouts';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-50">
        <Header />
      </div>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
