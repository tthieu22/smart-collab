import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { AntdRegistry } from '@smart/providers/AntdRegistry';
import { NotificationProvider } from '@smart/providers/NotificationProvider';
import { AuthProvider } from '@smart/providers/AuthProvider';
import GlobalPostDetailModal from '@smart/components/home/feed/GlobalPostDetailModal';

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
                {children}
                <GlobalPostDetailModal />
              </AuthProvider>
            </NotificationProvider>
          </AntdRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
