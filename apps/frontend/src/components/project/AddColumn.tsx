"use client";

import { useState } from "react";
import { Input } from "@smart/components/ui/input";
import { Button } from "@smart/components/ui/button";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { projectStore } from "@smart/store/project";
import { useBoardStore } from "@smart/store/setting";
import { getProjectSocketManager } from "@smart/store/realtime";

interface AddColumnProps {
  boardId: string;
}

export default function AddColumn({ boardId }: AddColumnProps) {
  const theme = useBoardStore((state) => state.theme);
  const currentProject = projectStore((state) => state.currentProject);
  const socketManager = getProjectSocketManager();

  const [showInput, setShowInput] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const getButtonVariant = (type: "primary" | "ghost") => {
    if (theme === "dark") {
      switch (type) {
        case "primary":
          return "bg-blue-600 hover:bg-blue-500 text-white";
        case "ghost":
          return "bg-gray-800 hover:bg-gray-700 text-white";
      }
    } else {
      switch (type) {
        case "primary":
          return "bg-blue-600 hover:bg-blue-700 text-white";
        case "ghost":
          return "bg-gray-200 hover:bg-gray-300 text-black";
      }
    }
  };

  const handleSave = async () => {
    if (!newColumnTitle.trim() || !currentProject) return;
    setLoading(true);

    try {
      await socketManager.createColumn(
        boardId,
        newColumnTitle.trim(),
        currentProject.id,
        (res) => {
          if (res.status === "success" || res.column) {
            setNewColumnTitle("");
            setShowInput(false);
          } else {
            console.error("Failed to create column:", res);
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Error creating column:", err);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewColumnTitle("");
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="min-w-[250px] flex flex-col gap-1 p-2">
      {!showInput && (
        <Button
          className={`${getButtonVariant("primary")} flex items-center gap-1`}
          size="small"
          onClick={() => setShowInput(true)}
          loading={loading}
        >
          <PlusOutlined /> Add another list
        </Button>
      )}

      {showInput && (
        <div className="relative">
          <Input
            autoFocus
            placeholder="Enter column title..."
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            size="small"
            variant="filled"
            onKeyDown={handleKeyDown}
            style={{ paddingRight: 32 }}
            disabled={loading}
          />
          {newColumnTitle && !loading && (
            <button
              onClick={handleCancel}
              aria-label="Cancel"
              type="button"
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                p-1 rounded-full
                text-gray-400 hover:text-gray-600
                dark:text-gray-500 dark:hover:text-gray-300
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500
                cursor-pointer
              "
              style={{ background: "transparent", border: "none" }}
            >
              <CloseOutlined style={{ fontSize: 16 }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
