import { AntdRegistry } from './providers/antd-registry';
import { NotificationProvider } from '@/app/providers/NotificationProvider';
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' translate='no'>
      <body>
        <AntdRegistry>
          <NotificationProvider>{children}</NotificationProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
