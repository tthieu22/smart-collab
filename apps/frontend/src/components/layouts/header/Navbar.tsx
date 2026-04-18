"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeOutlined,
  ProjectOutlined,
  ReadOutlined,
} from "@ant-design/icons";

export function Navbar() {
  const pathname = usePathname();

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
  ];

  return (
    <div className="flex items-center gap-2">
      {items.map((item) => {
        const isActive = pathname === item.key || pathname.startsWith(`${item.key}/`);

        return (
          <Link href={item.key} key={item.key} title={item.label}>
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
