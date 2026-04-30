'use client';

import type { ReactNode } from 'react';
 import AuthBackground from '@smart/components/auth/AuthBackground';
 import ProjectGuestCursor from '@smart/components/project/ProjectGuestCursor';
 
 export default function AuthLayout({ children }: { children: ReactNode }) {
   return (
     <div className="relative min-h-screen">
       <style jsx global>{`
         html, body { background: transparent !important; }
       `}</style>
       <AuthBackground />
       <ProjectGuestCursor />
       <div className="relative z-10">
         {children}
       </div>
     </div>
   );
 }
