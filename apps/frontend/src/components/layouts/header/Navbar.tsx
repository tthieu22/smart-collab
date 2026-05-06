"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Newspaper,
} from "lucide-react";
import { cn } from "@smart/lib/utils";
import { useFeedStore } from "@smart/store/feed";

export function Navbar() {
  const pathname = usePathname();
  const reloadFeed = useFeedStore((s) => s.reloadFeed);

  const items = [
    { key: "/", icon: <LayoutDashboard size={18} />, label: "Feed" },
    { key: "/projects", icon: <Layers size={18} />, label: "Dự án" },
    { key: "/news", icon: <Newspaper size={18} />, label: "Tin tức" },
  ];

  const handleItemClick = (e: React.MouseEvent, key: string) => {
    if (key === "/" && pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      reloadFeed();
    }
  };

  return (
    <nav className="flex items-center gap-1 bg-gray-100/50 dark:bg-white/5 p-1 rounded-xl border border-gray-200/50 dark:border-white/5">
      {items.map((item) => {
        const isActive = pathname === item.key || (item.key !== "/" && pathname.startsWith(item.key));

        return (
          <Link
            href={item.key}
            key={item.key}
            onClick={(e) => handleItemClick(e, item.key)}
            className={cn(
              "relative px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 group",
              isActive
                ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm shadow-black/5"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
            )}
          >
            <span className={cn(
              "transition-transform duration-300 group-hover:scale-110",
              isActive && "text-blue-600 dark:text-blue-400"
            )}>
              {item.icon}
            </span>
            <span className="hidden xl:block">{item.label}</span>

            {isActive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-neutral-800 animate-pulse" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
