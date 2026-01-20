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
        {/* Header */}
        <Header />

        {/* Body */}
        <div className="relative">
          <main className="bg-gray-100 dark:bg-gray-900 p-0 ">
            {children}
          </main>
        </div>

        {/* Footer */}
        <Footer />
    </ProjectRedirectProvider>
  );
}
