"use client";

import { motion } from "framer-motion";
import { Board as BoardType, Column as ColumnType } from "@smart/types/project";
import { projectStore } from "@smart/store/project";
import { useBoardStore } from "@smart/store/setting";
import Column from "./Column";
import AddColumn from "@smart/components/project/AddColumn";

interface BoardProps {
  board: BoardType;
  className?: string;
}

export default function Board({ board, className }: BoardProps) {
  const columnsStore = projectStore((state) => state.columns);
  const currentProject = projectStore((state) => state.currentProject);
  const theme = useBoardStore((state) => state.theme);

  console.groupCollapsed(`[Board] Render board ${board?.title ?? "Unknown"}`);
  console.log("🎨 Theme:", theme);
  console.log("🧩 Project:", currentProject);
  console.log("📋 Board:", board);
  console.log("📋 columnsStore:", columnsStore);
  console.groupEnd();

  if (!currentProject) return <div>Không có dự án</div>;
  if (!board) return <div>Không tìm thấy board</div>;

  const columnIds = board.columnIds ?? [];
  const columns: ColumnType[] = columnIds
    .map((id) => columnsStore[id])
    .filter((col): col is ColumnType => Boolean(col));

  return (
    <div
      className={`flex gap-4 overflow-x-auto p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm ${
        className ?? ""
      } ${
        theme === "dark"
          ? "bg-gradient-to-br from-[#1e1f22] to-[#2b2d31] text-gray-100"
          : "bg-gradient-to-br from-[#f4f5f7] to-[#e9ebee] text-gray-900"
      }`}
      style={{
        backgroundColor:
          theme === "dark"
            ? currentProject.color ?? "#1e1f22"
            : currentProject.color ?? "#f4f5f7",
        backgroundImage: currentProject.fileUrl
          ? `url(${currentProject.fileUrl})`
          : currentProject.background
          ? `url(${currentProject.background})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "300px",
        ...(theme === "dark" && {
          backgroundBlendMode: "normal",
          filter: "brightness(0.9)",
        }),
      }}
    >
      {columns.map((col) => (
        <motion.div
          key={col.id}
          layout
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Column column={col} />
        </motion.div>
      ))}

      <motion.div
        layout
        className="flex-shrink-0"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <AddColumn boardId={board.id} />
      </motion.div>
    </div>
  );
}
