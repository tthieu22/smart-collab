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
  const columnsStore = projectStore((s) => s.columns);
  const currentProject = projectStore((s) => s.currentProject);
  const theme = useBoardStore((s) => s.theme);

  if (!currentProject) return <div>Không có dự án</div>;
  if (!board) return <div>Không tìm thấy board</div>;

  const columns: ColumnType[] = (board.columnIds ?? [])
    .map((id) => columnsStore[id])
    .filter((col): col is ColumnType => Boolean(col))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div
      className={`flex gap-4 overflow-x p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm w-full ${
        className ?? ""
      } ${
        theme === "dark"
          ? "bg-gradient-to-br from-[#1e1f22] to-[#2b2d31] text-gray-100"
          : "bg-gradient-to-br from-[#f4f5f7] to-[#e9ebee] text-gray-900"
      }`}
      style={{
        flexWrap: "nowrap",
        backgroundColor:
          theme === "dark"
            ? currentProject.color ?? "#1e1f22"
            : currentProject.color ?? "#f4f5f7",
        backgroundImage:
          currentProject.fileUrl || currentProject.background
            ? `url(${currentProject.fileUrl ?? currentProject.background})`
            : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "300px",
        ...(theme === "dark" && {
          backgroundBlendMode: "normal",
          filter: "brightness(0.9)",
        }),
        maxWidth: "100vw",
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
