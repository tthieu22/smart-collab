import { useRouter } from "next/navigation";
import { Dropdown, Avatar, Card, Divider } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  RobotOutlined,
  BgColorsOutlined,
  BulbOutlined,
  MoonOutlined,
  DesktopOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useState, useCallback, useEffect } from "react";
import { useUserStore } from "@smart/store/user";
import { useBoardStore } from "@smart/store/setting";

export function AvatarMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { currentUser, clearUserStore } = useUserStore();
  const isUserAdmin = String(currentUser?.role || "").toUpperCase() === "ADMIN";

  const theme = useBoardStore((s) => s.theme);
  const setTheme = useBoardStore((s) => s.setTheme);
  const [currentTheme, setCurrentTheme] = useState<string | null>(theme);

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  const handleSetTheme = (val: "light" | "dark" | "system") => {
    if (val === "light" || val === "dark") setTheme(val);
    setCurrentTheme(val);
    try {
      localStorage.setItem("theme", val);
    } catch {}

    if (val === "dark") {
      document.documentElement.classList.add("dark");
    } else if (val === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  };

  const navigateLater = useCallback((path: string) => {
    setOpen(false);
    setTimeout(() => {
      router.push(path);
    }, 50);
  }, [router]);

  const onMenuClick = (info: any) => {
    const { key } = info;
    if (key === "profile" || key === "card") {
      const profilePath = currentUser?.id ? `/profile/${currentUser.id}` : "/profile";
      navigateLater(profilePath);
    } else if (key === "user-setting") {
      navigateLater("/user/settings");
    } else if (key === "logout") {
      clearUserStore();
      navigateLater("/login");
    } else if (key === "ai-auto-post") {
      navigateLater("/admin/ai-auto-post");
    } else if (key === "theme-light") {
      handleSetTheme("light");
    } else if (key === "theme-dark") {
      handleSetTheme("dark");
    } else if (key === "theme-system") {
      handleSetTheme("system");
    }
  };

  const items: any[] = [
    {
      key: "card",
      label: (
        <Card bordered={false} bodyStyle={{ padding: "8px 4px" }} className="dark:bg-neutral-900 border-none">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 240 }}>
            <Avatar size={48} src={currentUser?.avatar} icon={!currentUser?.avatar && <UserOutlined />}>
              {!currentUser?.avatar && (currentUser?.email?.charAt(0).toUpperCase() || null)}
            </Avatar>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }} className="truncate">
                {currentUser?.email?.split("@")[0] || "Khách"}
              </div>
              <div style={{ color: "#888", fontSize: 12 }} className="truncate">
                {currentUser?.email || "user@example.com"}
              </div>
            </div>
          </div>
        </Card>
      ),
    },
    { type: 'divider' },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
    },
    {
      key: "user-setting",
      icon: <SettingOutlined />,
      label: "Cài đặt người dùng",
    },
    {
      key: "theme",
      icon: <BgColorsOutlined />,
      label: "Giao diện",
      children: [
        {
          key: "theme-light",
          icon: <BulbOutlined />,
          label: (
            <div className="flex items-center justify-between min-w-[120px]">
              <span>Sáng</span>
              {currentTheme === "light" && <CheckOutlined className="text-blue-500" />}
            </div>
          )
        },
        {
          key: "theme-dark",
          icon: <MoonOutlined />,
          label: (
            <div className="flex items-center justify-between min-w-[120px]">
              <span>Tối</span>
              {currentTheme === "dark" && <CheckOutlined className="text-blue-500" />}
            </div>
          )
        },
        {
          key: "theme-system",
          icon: <DesktopOutlined />,
          label: (
            <div className="flex items-center justify-between min-w-[120px]">
              <span>Hệ thống</span>
              {currentTheme === "system" && <CheckOutlined className="text-blue-500" />}
            </div>
          )
        }
      ]
    },
    ...(isUserAdmin ? [
      {
        key: "ai-auto-post",
        icon: <RobotOutlined />,
        label: "AI Auto Post",
      }
    ] : []),
    { type: 'divider' },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
    },
  ];

  return (
    <Dropdown
      menu={{ items, onClick: onMenuClick }}
      placement="bottomRight"
      trigger={["click"]}
      open={open}
      onOpenChange={(o) => setOpen(o)}
      overlayClassName="avatar-menu-dropdown"
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
        <Avatar size="small" src={currentUser?.avatar} icon={!currentUser?.avatar && <UserOutlined />}>
          {!currentUser?.avatar && (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : null)}
        </Avatar>
      </div>
    </Dropdown>
  );
}

