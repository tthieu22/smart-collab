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

  return <>{children}</>;
}
