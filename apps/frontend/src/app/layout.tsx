import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { AntdRegistry } from '@smart/providers/AntdRegistry';
import { NotificationProvider } from '@smart/providers/NotificationProvider';
import { AuthProvider } from '@smart/providers/AuthProvider';
import GlobalPostDetailModal from '@smart/components/home/feed/GlobalPostDetailModal';
import { Spin } from 'antd';
import React from 'react';

export const metadata: Metadata = {
  title: 'Smart Collab',
  description: 'Smart Collab',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <AntdRegistry>
            <NotificationProvider>
              <AuthProvider>
                <React.Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-neutral-950"><Spin size="large" /></div>}>
                  {children}
                  <GlobalPostDetailModal />
                </React.Suspense>
              </AuthProvider>
            </NotificationProvider>
          </AntdRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
