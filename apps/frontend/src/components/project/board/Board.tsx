import { useState } from "react";
import Column from "./Column";
import { projectStore } from "@smart/store/project";
import { Board as BoardType, Column as ColumnType } from "@smart/types/project";

interface BoardProps {
  board: BoardType;
}

export default function Board({ board }: BoardProps) {
  const addColumnStore = projectStore((state) => state.addColumn);
  const currentProject = projectStore((state) => state.currentProject);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  if (!currentProject) return <div>Không có dự án</div>;

  const columns = board.columns ?? [];

  const handleAddColumn = () => {
    if (!newColumnTitle.trim() || !currentProject) return;
    const now = new Date().toISOString();
    addColumnStore(currentProject.id, {
      id: crypto.randomUUID(),
      projectId: currentProject.id,
      title: newColumnTitle,
      position: columns.length,
      createdAt: now,
      updatedAt: now,
    } as ColumnType);
    setNewColumnTitle("");
  };

  return (
    <div>
      <div className="flex gap-4 overflow-x-auto">
        {columns.map((col) => (
          <Column key={col.id} column={col} />
        ))}
        <div className="min-w-[200px] flex flex-col gap-1">
          <input
            type="text"
            placeholder="New Column"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            className="border rounded px-1 py-0.5 text-sm"
          />
          <button
            onClick={handleAddColumn}
            className="bg-green-500 text-white rounded px-2 py-1 text-sm"
          >
            Add Column
          </button>
        </div>
      </div>
    </div>
  );
}
