'use client';

import type { ReactNode } from 'react';
import AuthBackground from '@smart/components/auth/AuthBackground';
import ProjectGuestCursor from '@smart/components/project/ProjectGuestCursor';
import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useBoardStore } from '@smart/store/setting';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { resolvedTheme, setTheme } = useBoardStore();

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add("dark");
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <style jsx global>{`
        html, body { 
          background: transparent !important; 
          overflow-x: hidden;
        }
      `}</style>
      
      {/* Background layer - Fixed at z-0 */}
      <AuthBackground />
      
      {/* Cursor layer */}
      <ProjectGuestCursor />

      {/* Theme Toggle Button */}
      <div className="fixed top-6 right-6 z-50">
        <Tooltip title={resolvedTheme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}>
          <Button
            shape="circle"
            icon={resolvedTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            size="large"
            className="flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-md border-white/20 dark:border-white/10 shadow-lg hover:scale-110 transition-transform"
          />
        </Tooltip>
      </div>
      
      {/* Content layer - Relative at z-10 */}
      <div className="relative z-10 min-h-screen w-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
