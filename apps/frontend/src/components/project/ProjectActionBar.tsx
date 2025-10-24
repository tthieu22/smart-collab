"use client";

import { MailOutlined, CalendarOutlined, AppstoreOutlined, SwitcherOutlined } from "@ant-design/icons";
import { useBoardStore } from "@smart/store/board";

interface ProjectActionBarProps {
  activeComponents: string[];
  onToggle: (key: string) => void;
}

export default function ProjectActionBar({ activeComponents, onToggle }: ProjectActionBarProps) {
  const theme = useBoardStore((s) => s.theme);

  const buttons = [
    { key: "inbox", label: "Inbox", icon: <MailOutlined /> },
    { key: "calendar", label: "Calendar", icon: <CalendarOutlined /> },
    { key: "board", label: "Board", icon: <AppstoreOutlined /> },
    { key: "switch", label: "Switch Board", icon: <SwitcherOutlined /> },
  ];

  // ---------------- Theme CSS (trong suốt hơn) ----------------
  const baseBg = theme === "dark" ? "bg-black/30" : "bg-white/30";
  const baseText = theme === "dark" ? "text-white/80" : "text-black/90";
  const hoverBg = theme === "dark" ? "hover:bg-black/20" : "hover:bg-white/40";
  const activeBg = theme === "dark" ? "bg-black/60" : "bg-white/60";
  const activeText = theme === "dark" ? "text-blue-400" : "text-blue-600";

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
        ${baseBg} backdrop-blur-sm border border-white/20 rounded-xl px-1.5 py-1.5 shadow-lg`}
    >
      {buttons.map(({ key, label, icon }) => {
        const isActive = activeComponents.includes(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-150
              ${isActive ? `${activeBg} ${activeText} shadow-[0_0_8px_rgba(59,130,246,0.3)]` : `${baseText} ${hoverBg}`}`}
          >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
