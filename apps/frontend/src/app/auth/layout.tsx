'use client';

import type { ReactNode } from 'react';
import AuthBackground from '@smart/components/auth/AuthBackground';
import ProjectGuestCursor from '@smart/components/project/ProjectGuestCursor';

export default function AuthLayout({ children }: { children: ReactNode }) {
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
      
      {/* Content layer - Relative at z-10 */}
      <div className="relative z-10 min-h-screen w-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
