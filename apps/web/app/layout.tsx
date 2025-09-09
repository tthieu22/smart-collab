import { AntdRegistry } from './providers/antd-registry';
import { NotificationProvider } from './providers/NotificationProvider';
import { AuthProvider } from './providers/AuthProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AuthNexus',
  description: 'Secure Authentication System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <NotificationProvider>
            <AuthProvider>{children}</AuthProvider>
          </NotificationProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
