"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeOutlined,
  ProjectOutlined,
  ReadOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import { useFeedStore } from "@smart/store/feed";

export function Navbar() {
  const pathname = usePathname();
  const reloadFeed = useFeedStore((s) => s.reloadFeed);

  const items = [
    { key: "/", icon: <HomeOutlined style={{ fontSize: 20 }} />, label: "Home" },
    {
      key: "/projects",
      icon: <ProjectOutlined style={{ fontSize: 20 }} />,
      label: "Projects",
    },
    {
      key: "/news",
      icon: <ReadOutlined style={{ fontSize: 20 }} />,
      label: "Tin tức",
    },
    {
      key: "/admin/ai-auto-post",
      icon: <SettingOutlined style={{ fontSize: 20 }} />,
      label: "Cấu hình AI",
    },
  ];

  const handleItemClick = (e: React.MouseEvent, key: string) => {
    if (key === "/" && pathname === "/") {
      // If already on Home, scroll to top and reload
      window.scrollTo({ top: 0, behavior: "smooth" });
      reloadFeed();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {items.map((item) => {
        const isActive = pathname === item.key || pathname.startsWith(`${item.key}/`);

        return (
          <Link 
            href={item.key} 
            key={item.key} 
            title={item.label}
            onClick={(e) => handleItemClick(e, item.key)}
          >
            <div
              className={`i-box ${isActive ? "active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {item.icon}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
