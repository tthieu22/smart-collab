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
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function SettingMenu() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  // sync theme
  useEffect(() => {
    if (theme) setCurrent(theme);
  }, [theme]);

  const handleSet = (val: "light" | "dark" | "system") => {
    setTheme(val);
    try {
      localStorage.setItem("theme", val);
    } catch {}
    setCurrent(val);

    // thêm class dark/light thủ công nếu muốn control ngoài next-themes
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
      key: "profile",
      label: (
        <div
          style={{ display: "flex", alignItems: "center", gap: 8 }}
          onClick={() => router.push("/user")}
        >
          <SettingOutlined />
          <span>Cài đặt cá nhân</span>
        </div>
      ),
    },
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
              className="theme-option"
              onClick={() => handleSet("light")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BulbOutlined />
                <span>Sáng</span>
              </div>
              {current === "light" && <CheckOutlined />}
            </div>
          ),
        },
        {
          key: "theme-dark",
          label: (
            <div
              className="theme-option"
              onClick={() => handleSet("dark")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MoonOutlined />
                <span>Tối</span>
              </div>
              {current === "dark" && <CheckOutlined />}
            </div>
          ),
        },
        {
          key: "theme-system",
          label: (
            <div
              className="theme-option"
              onClick={() => handleSet("system")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DesktopOutlined />
                <span>Hệ thống</span>
              </div>
              {current === "system" && <CheckOutlined />}
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
        className={`i-box ${open ? "active" : ""}`}
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
