import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { AntdRegistry } from '@smart/providers/AntdRegistry';
import { NotificationProvider } from '@smart/providers/NotificationProvider';
import { AuthProvider } from '@smart/providers/AuthProvider';
import GlobalPostDetailModal from '@smart/components/home/feed/GlobalPostDetailModal';
import AppWrapper from '@smart/components/layouts/AppWrapper';
import { Spin } from 'antd';
import { Inter } from 'next/font/google';
import React from 'react';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
});

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
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable} font-sans antialiased bg-white dark:bg-[#0a0a0a]`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <AntdRegistry>
            <NotificationProvider>
              <AuthProvider>
                <AppWrapper>
                  <React.Suspense fallback={null}>
                    {children}
                    <GlobalPostDetailModal />
                  </React.Suspense>
                </AppWrapper>
              </AuthProvider>
            </NotificationProvider>
          </AntdRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
