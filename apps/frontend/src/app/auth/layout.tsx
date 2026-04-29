import type { ReactNode } from 'react';
 import AuthBackground from '@smart/components/auth/AuthBackground';
 import ProjectGuestCursor from '@smart/components/project/ProjectGuestCursor';
 
 export default function AuthLayout({ children }: { children: ReactNode }) {
   return (
     <div className="relative min-h-screen login-overlay-container">
       <AuthBackground />
       <ProjectGuestCursor />
       {children}
     </div>
   );
 }
