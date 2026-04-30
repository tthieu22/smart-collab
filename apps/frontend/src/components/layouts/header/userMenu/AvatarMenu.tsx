import { useRouter } from "next/navigation";
import { Dropdown, Avatar, Card, Divider } from "antd";
import {
  User,
  LogOut,
  Settings,
  Bot,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  ChevronRight
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useUserStore } from "@smart/store/user";
import { useBoardStore } from "@smart/store/setting";
import UserAvatar from "@smart/components/ui/UserAvatar";
import { cn } from "@smart/lib/utils";

export function AvatarMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { currentUser, clearUserStore } = useUserStore();
  const isUserAdmin = String(currentUser?.role || "").toUpperCase() === "ADMIN";

  const meId = currentUser?.id || "";

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
    } catch { }

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
      navigateLater("/auth/login");
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
        <Card variant="borderless" styles={{ body: { padding: "8px 4px" } }} className="dark:bg-neutral-900 border-none bg-transparent">
          <div className="flex items-center gap-4 min-w-[240px]">
            <UserAvatar userId={meId} size="md" allowChangeMood={false} />
            <div className="overflow-hidden">
              <div className="font-black text-sm text-gray-900 dark:text-white truncate">
                {currentUser?.email?.split("@")[0] || "Khách"}
              </div>
              <div className="text-[11px] font-bold text-gray-500 truncate">
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
      icon: <User size={16} />,
      label: <span className="text-xs font-bold">Thông tin cá nhân</span>,
    },
    {
      key: "user-setting",
      icon: <Settings size={16} />,
      label: <span className="text-xs font-bold">Cài đặt người dùng</span>,
    },
    {
      key: "theme",
      icon: <Palette size={16} />,
      label: <span className="text-xs font-bold">Giao diện</span>,
      children: [
        {
          key: "theme-light",
          icon: <Sun size={14} />,
          label: (
            <div className="flex items-center justify-between min-w-[120px] text-xs font-bold">
              <span>Sáng</span>
              {currentTheme === "light" && <Check size={14} className="text-blue-500" />}
            </div>
          )
        },
        {
          key: "theme-dark",
          icon: <Moon size={14} />,
          label: (
            <div className="flex items-center justify-between min-w-[120px] text-xs font-bold">
              <span>Tối</span>
              {currentTheme === "dark" && <Check size={14} className="text-blue-500" />}
            </div>
          )
        },
        {
          key: "theme-system",
          icon: <Monitor size={14} />,
          label: (
            <div className="flex items-center justify-between min-w-[120px] text-xs font-bold">
              <span>Hệ thống</span>
              {currentTheme === "system" && <Check size={14} className="text-blue-500" />}
            </div>
          )
        }
      ]
    },
    ...(isUserAdmin ? [
      {
        key: "ai-auto-post",
        icon: <Bot size={16} />,
        label: <span className="text-xs font-bold">AI Auto Post</span>,
      }
    ] : []),
    { type: 'divider' },
    {
      key: "logout",
      icon: <LogOut size={16} />,
      label: <span className="text-xs font-bold">Đăng xuất</span>,
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
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5",
          open && "bg-gray-100 dark:bg-white/5"
        )}
      >
        <UserAvatar userId={meId} size="sm" allowChangeMood={false} />
      </div>
    </Dropdown>
  );
}

