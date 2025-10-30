"use client";

import { Board as BoardType, Column as ColumnType } from "@smart/types/project";
import { projectStore } from "@smart/store/project";
import { useBoardStore } from "@smart/store/board";
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

  if (!currentProject) return <div>Không có dự án</div>;

  const columns: ColumnType[] = board.columnIds
    .map((id) => columnsStore[id])
    .filter(Boolean);

  return (
    <div
      className={`flex gap-2 overflow-x-auto p-2 rounded-lg ${className ?? ""}`}
      style={{
        backgroundColor: currentProject.color ?? "#f4f5f7",
        backgroundImage: currentProject.fileUrl
          ? `url(${currentProject.fileUrl})`
          : currentProject.background
          ? `url(${currentProject.background})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "300px",
      }}
    >
      {columns.map((col) => (
        <Column key={col.id} column={col} />
      ))}

      {/* Thêm column bằng component riêng */}
      <AddColumn boardId={board.id} />
    </div>
  );
}
