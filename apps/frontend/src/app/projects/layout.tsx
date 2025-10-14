"use client";

import { Header, Footer } from "@smart/components/layouts";
import ProjectRedirectProvider from "@smart/providers/ProjectRedirectProvider";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectRedirectProvider>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <Header />

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-0 min-h-0">
            {children}
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </ProjectRedirectProvider>
  );
}
