'use client';

import { Header, Footer } from '@smart/components/layouts';
import ProjectRedirectProvider from '@smart/providers/ProjectRedirectProvider';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectRedirectProvider>
      <div className="relative">{children}</div>
    </ProjectRedirectProvider>
  );
}
