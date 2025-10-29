'use client';

import { useState } from "react";
import { Input } from "@smart/components/ui/input";
import { Button } from "@smart/components/ui/button";
import { projectStore } from "@smart/store/project";
import { useBoardStore } from "@smart/store/board";
import type { Card } from "@smart/types/project";

interface AddCardProps {
  projectId: string;
  columnId: string;
}

export function AddCard({ projectId, columnId }: AddCardProps) {
  const [showInput, setShowInput] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const { addCard } = projectStore();
  const theme = useBoardStore.getState().theme; 

  const handleSave = () => {
    if (!title.trim()) return;
    setLoading(true);

    const newCard: Card = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: "",
      columnId,
      projectId,
      labels: [],
      views: [],
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCard(projectId, newCard);
    setTitle("");
    setShowInput(false);
    setLoading(false);
  };

  const handleCancel = () => {
    setTitle("");
    setShowInput(false);
  };

  // lớp bg cho nút theo theme
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
    <div className={`flex flex-col gap-2 p-2`}>
      {!showInput && (
        <Button
          className={getButtonVariant("primary")}
          size="small"
          onClick={() => setShowInput(true)}
        >
          + Add Card
        </Button>
      )}

      {showInput && (
        <>
          <Input
            autoFocus
            placeholder="Enter card title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="small"
            variant="filled" // luôn có bg
            onPressEnter={handleSave}
          />
          <div className="flex gap-2 mt-1">
            <Button
              size="small"
              className={getButtonVariant("primary")}
              onClick={handleSave}
              loading={loading}
            >
              Save
            </Button>
            <Button
              className={getButtonVariant("ghost")}
              size="small"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
