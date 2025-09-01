import { AntdRegistry } from './providers/antd-registry';
import { NotificationProvider } from './providers/NotificationProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AuthNexus',
  description: 'Secure Authentication System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>
        <AntdRegistry>
          <NotificationProvider>{children}</NotificationProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
