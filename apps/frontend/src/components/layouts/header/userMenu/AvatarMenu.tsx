"use client";

import { useRouter } from "next/navigation";
import { Dropdown, Avatar, Card } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useState, useCallback } from "react";
import { useUserStore } from "@smart/store/user";

export function AvatarMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { currentUser, clearUserStore } = useUserStore();

  // helper: first close dropdown, then navigate on next tick
  const navigateLater = useCallback((path: string) => {
    setOpen(false);
    setTimeout(() => {
      router.push(path);
    }, 50);
  }, [router]);

  const handleProfileClick = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigateLater("/user");
  }, [navigateLater]);

  const handleUserSettings = useCallback(() => {
    navigateLater("/user/settings");
  }, [navigateLater]);

  const handleLogout = useCallback(() => {
    try {
      clearUserStore();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      navigateLater("/login");
    }
  }, [clearUserStore, navigateLater]);

  const items = [
    {
      key: "card",
      label: (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleProfileClick(e);
          }}
        >
          <Card hoverable bordered={false} style={{ width: 280, padding: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar size={48} icon={<UserOutlined />}>
                {currentUser?.email?.charAt(0).toUpperCase() || null}
              </Avatar>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {currentUser?.email?.split("@")[0] || "Khách"}
                </div>
                <div style={{ color: "#666", fontSize: 13 }}>
                  {currentUser?.email || "user@example.com"}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: "profile",
      label: (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleProfileClick(e);
          }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <UserOutlined />
          <span>Hồ sơ</span>
        </div>
      ),
    },
    {
      key: "user-setting",
      label: (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleUserSettings();
          }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <SettingOutlined />
          <span>Cài đặt người dùng</span>
        </div>
      ),
    },
    {
      key: "logout",
      label: (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleLogout();
          }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <LogoutOutlined />
          <span>Đăng xuất</span>
        </div>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{ items }}
      placement="bottomRight"
      trigger={["click"]}
      open={open}
      onOpenChange={(o) => setOpen(o)}
      getPopupContainer={() => document.body}
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
        <Avatar size="small" icon={<UserOutlined />}>
          {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : null}
        </Avatar>
      </div>
    </Dropdown>
  );

}
