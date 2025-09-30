"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

export function Navbar() {
  const pathname = usePathname();

  const items = [
    { key: "/", icon: <HomeOutlined /> }
  ];

  return (
    <div style={{ display: "flex", alignItems: "left", gap: 20 }}>
      {items.map((item) => {
        const isActive = pathname === item.key;

        return (
          <Link href={item.key} key={item.key}>
            <div
              className={`i-box ${isActive ? "active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontSize: 22, // icon to hơn
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
