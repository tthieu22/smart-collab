"use client";

import { useState } from "react";
import { Dropdown } from "antd";
import {
  EllipsisOutlined,
  FilterOutlined,
  MinusSquareOutlined,
  PlusSquareOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

interface ColumnMenuProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onFilter?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  extraItems?: {
    key: string;
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    group?: string; // nhóm hiển thị (ví dụ "Tùy chọn khác")
  }[];
}

export function ColumnMenu({
  collapsed,
  onToggleCollapse,
  onFilter,
  onRename,
  onDelete,
  extraItems = [],
}: ColumnMenuProps) {
  const [open, setOpen] = useState(false);

  const handleClick = (fn?: () => void) => {
    setOpen(false);
    if (fn) fn();
  };

  // nhóm hiển thị
  const groupedItems = [
    {
      title: "Hiển thị",
      children: [
        {
          key: "collapse",
          label: collapsed ? "Mở rộng cột" : "Thu nhỏ cột",
          icon: collapsed ? <PlusSquareOutlined /> : <MinusSquareOutlined />,
          onClick: () => handleClick(onToggleCollapse),
        },
        {
          key: "filter",
          label: "Lọc thẻ",
          icon: <FilterOutlined />,
          onClick: () => handleClick(onFilter),
        },
      ],
    },
    {
      title: "Chỉnh sửa",
      children: [
        {
          key: "rename",
          label: "Đổi tên cột",
          icon: <EditOutlined />,
          onClick: () => handleClick(onRename),
        },
        {
          key: "delete",
          label: "Xóa cột",
          icon: <DeleteOutlined className="text-red-500" />,
          onClick: () => handleClick(onDelete),
        },
      ],
    },
  ];

  if (extraItems.length > 0) {
    const grouped = extraItems.reduce<Record<string, any[]>>((acc, item) => {
      const group = item.group || "Tùy chọn khác";
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});
    for (const [group, children] of Object.entries(grouped)) {
      groupedItems.push({ title: group, children });
    }
  }

  const menu = (
    <div
      className="
        bg-white/40 dark:bg-black/40 backdrop-blur-md 
        border border-white/30 dark:border-black/30 rounded-xl shadow-lg
        overflow-hidden text-sm min-w-[180px]
      "
    >
      {groupedItems.map((group, idx) => (
        <div
          key={group.title}
          className={`py-1 ${idx !== groupedItems.length - 1 ? "border-b border-white/20 dark:border-black/20" : ""}`}
        >
          <div className="px-3 py-1 text-[11px] uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
            {group.title}
          </div>
          {group.children.map((item) => (
            <button
              key={item.key}
              onClick={() => handleClick(item.onClick)}
              className="
                w-full flex items-center gap-2 px-3 py-2 
                text-gray-800 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-black/30
                transition-colors duration-200 text-left rounded-md
              "
            >
              <span className="text-gray-500 dark:text-gray-400">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => menu}
      trigger={["click"]}
      placement="bottomRight"
    >
      <button
        onClick={(e) => e.preventDefault()}
        className="
          p-1 rounded-lg bg-white/40 dark:bg-black/40 
          hover:bg-white/60 dark:hover:bg-black/60 
          text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white
          transition-colors duration-200
        "
      >
        <EllipsisOutlined style={{ fontSize: 18 }} />
      </button>
    </Dropdown>
  );
}
