"use client";

import { MailOutlined, CalendarOutlined, AppstoreOutlined, SwitcherOutlined } from "@ant-design/icons";
import { useBoardStore } from "@smart/store/setting";
import { useState } from "react";
import ProjectSwitchModal from "./ProjectSwitchModal";

interface ProjectActionBarProps {
  activeComponents: string[];
  onToggle: (key: string) => void;
}

export default function ProjectActionBar({ activeComponents, onToggle }: ProjectActionBarProps) {
  // Dùng store để lấy theme nhưng không dùng biến style nữa, chỉ để biết theme hiện tại (nếu cần)
  const theme = useBoardStore((s) => s.theme);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  const buttons = [
    { key: "inbox", label: "Inbox", icon: <MailOutlined /> },
    { key: "calendar", label: "Calendar", icon: <CalendarOutlined /> },
    { key: "board", label: "Board", icon: <AppstoreOutlined /> },
    { key: "switch", label: "Switch Board", icon: <SwitcherOutlined /> },
  ];

  return (
    <div
      className="
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
        bg-white/30 dark:bg-black/30 backdrop-blur-sm border border-white/20 dark:border-black/20
        rounded-xl px-1.5 py-1.5 shadow-lg
      "
    >
      {buttons.map(({ key, label, icon }) => {
        const isActive = activeComponents.includes(key);
        return (
          <button
            key={key}
            onClick={() => {
              if (key === "switch") {
                setIsSwitchModalOpen(true);
              } else {
                onToggle(key);
              }
            }}
            className={`
              flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-150
              ${isActive
                ? "bg-white/60 dark:bg-black/60 text-blue-600 dark:text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                : "text-black/90 dark:text-white/80 hover:bg-white/40 dark:hover:bg-black/20"
              }
            `}
          >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}

      <ProjectSwitchModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
      />
    </div>
  );
}
