import type { Metadata } from "next";
import "./globals.css";

import { AntdRegistry } from '@auth/providers/AntdRegistry';
import { NotificationProvider } from "@auth/providers/NotificationProvider";
import { AuthProvider } from "@auth/providers/AuthProvider";

export const metadata: Metadata = {
  title: "AuthNexus",
  description: "Secure Authentication System",
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
