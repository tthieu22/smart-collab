"use client";

import { useState } from "react";
import { Input } from "@smart/components/ui/input";
import { Button } from "@smart/components/ui/button";
import { PlusOutlined } from "@ant-design/icons";
import { projectStore } from "@smart/store/project";
import { useBoardStore } from "@smart/store/setting";

interface AddColumnProps {
  boardId: string;
}

export default function AddColumn({ boardId }: AddColumnProps) {
  const addColumnStore = projectStore((state) => state.addColumn);
  const theme = useBoardStore((state) => state.theme);

  const [showInput, setShowInput] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (!newColumnTitle.trim()) return;
    setLoading(true);
    // addColumnStore(boardId, newColumnTitle);
    setNewColumnTitle("");
    setShowInput(false);
    setLoading(false);
  };

  const handleCancel = () => {
    setNewColumnTitle("");
    setShowInput(false);
  };

  const getButtonVariant = (type: "primary" | "success" | "ghost") => {
    if (theme === "dark") {
      switch (type) {
        case "primary": return "bg-blue-600 hover:bg-blue-500 text-white";
        case "success": return "bg-green-600 hover:bg-green-500 text-white";
        case "ghost": return "bg-gray-800 hover:bg-gray-700 text-white";
      }
    } else {
      switch (type) {
        case "primary": return "bg-blue-600 hover:bg-blue-700 text-white";
        case "success": return "bg-green-600 hover:bg-green-700 text-white";
        case "ghost": return "bg-gray-200 hover:bg-gray-300 text-black";
      }
    }
  };

  return (
    <div className="min-w-[250px] flex flex-col gap-1 p-2">
      {!showInput && (
        <Button
          className={getButtonVariant("primary")}
          size="small"
          onClick={() => setShowInput(true)}
        >
          <PlusOutlined /> Add another list
        </Button>
      )}

      {showInput && (
        <>
          <Input
            autoFocus
            placeholder="Enter column title..."
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            size="small"
            variant="filled"
            onPressEnter={handleSave}
          />
          <div className="flex gap-2 mt-1">
            
            <Button
              className={getButtonVariant("ghost")}
              size="small"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              size="small"
              className={getButtonVariant("primary")}
              onClick={handleSave}
              loading={loading}
            >
              Save
            </Button>
            
          </div>
        </>
      )}
    </div>
  );
}
