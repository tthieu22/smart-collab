import type { Metadata } from 'next';
import './globals.css';

import { AntdRegistry } from '@smart/providers/AntdRegistry';
import { NotificationProvider } from '@smart/providers/NotificationProvider';
import { AuthProvider } from '@smart/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'Mood Map',
  description: 'Mood Map',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AntdRegistry>
          <NotificationProvider>
            <AuthProvider>{children}</AuthProvider>
          </NotificationProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
