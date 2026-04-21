"use client";

import { useRouter } from "next/navigation";
import {
  SettingOutlined,
  BgColorsOutlined,
  BulbOutlined,
  MoonOutlined,
  DesktopOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { Dropdown } from "antd";
import { useEffect, useState } from "react";
import { useBoardStore } from "@smart/store/setting";

export function SettingMenu() {
  const router = useRouter();
  const theme = useBoardStore((s) => s.theme);
  const setTheme = useBoardStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(theme);

  // sync state với store
  useEffect(() => {
    setCurrent(theme);
  }, [theme]);

  const handleSet = (val: "light" | "dark" | "system") => {
    // lưu vào store nếu light/dark
    if (val === "light" || val === "dark") setTheme(val);
    setCurrent(val);
    try {
      localStorage.setItem("theme", val);
    } catch {}

    // thêm class dark/light cho document
    if (val === "dark") {
      document.documentElement.classList.add("dark");
    } else if (val === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // system → tùy theo OS
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  };

  const items = [
    {
      key: "theme",
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BgColorsOutlined />
          <span>Cài đặt chủ đề</span>
        </div>
      ),
      children: [
        {
          key: "theme-light",
          label: (
            <div 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minWidth: 120, padding: "4px 0" }} 
              onClick={(e) => {
                e.stopPropagation();
                handleSet("light");
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BulbOutlined />
                <span>Sáng</span>
              </div>
              {current === "light" && <CheckOutlined style={{ color: "#1890ff" }} />}
            </div>
          ),
        },
        {
          key: "theme-dark",
          label: (
            <div 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minWidth: 120, padding: "4px 0" }} 
              onClick={(e) => {
                e.stopPropagation();
                handleSet("dark");
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MoonOutlined />
                <span>Tối</span>
              </div>
              {current === "dark" && <CheckOutlined style={{ color: "#1890ff" }} />}
            </div>
          ),
        },
        {
          key: "theme-system",
          label: (
            <div 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minWidth: 120, padding: "4px 0" }} 
              onClick={(e) => {
                e.stopPropagation();
                handleSet("system");
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DesktopOutlined />
                <span>Hệ thống</span>
              </div>
              {current === "system" && <CheckOutlined style={{ color: "#1890ff" }} />}
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <Dropdown
      menu={{ items }}
      placement="bottom"
      trigger={["click"]}
      open={open}
      onOpenChange={setOpen}
    >
      <div
        className={`i-box ${open ? "active" : ""} hover:bg-gray-50 dark:hover:bg-neutral-800`}
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
        <SettingOutlined style={{ fontSize: 20 }} />
      </div>
    </Dropdown>
  );
}
