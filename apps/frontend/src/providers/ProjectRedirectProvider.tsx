"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { projectStore } from "@smart/store/project";

export default function ProjectRedirectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentProject = projectStore((s) => s.currentProject);

  useEffect(() => {
    if (
        currentProject &&
        (pathname.startsWith("/projects")) &&
        pathname !== `/projects/${currentProject.id}`
    ) {
      router.push(`/projects/${currentProject.id}`);
    }
  }, [currentProject, pathname, router]);

  return <>{children}</>;
}
