"use client";

import { useState } from "react";
import { Input } from "@smart/components/ui/input";
import { Button } from "@smart/components/ui/button";
import { PlusOutlined } from "@ant-design/icons";
import { projectStore } from "@smart/store/project";
import { useBoardStore } from "@smart/store/setting";
import { getProjectSocketManager } from "@smart/store/realtime";

interface AddCardProps {
  projectId: string;
  columnId: string;
}

export function AddCard({ projectId, columnId }: AddCardProps) {
  const theme = useBoardStore((state) => state.theme);
  const socketManager = getProjectSocketManager();

  const [showInput, setShowInput] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newCardTitle.trim()) return;
    setLoading(true);

    console.log("[AddCard] Sending createCard with title:", newCardTitle.trim());

    try {
      await socketManager.createCard(
        projectId,
        columnId,
        newCardTitle.trim(),
        (res) => {
          console.log("📨 [AddCard] card.create response", res);
          if (res.status === "success" || res.card) {
            console.log("[AddCard] Card created successfully");
            setNewCardTitle("");
            setShowInput(false);
          } else {
            console.error("[AddCard] Failed to create card:", res);
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("[AddCard] Error creating card:", err);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log("[AddCard] Create card cancelled");
    setNewCardTitle("");
    setShowInput(false);
  };

  const getButtonVariant = (type: "primary" | "success" | "ghost") => {
    if (theme === "dark") {
      switch (type) {
        case "primary":
          return "bg-blue-600 hover:bg-blue-500 text-white";
        case "success":
          return "bg-green-600 hover:bg-green-500 text-white";
        case "ghost":
          return "bg-gray-800 hover:bg-gray-700 text-white";
      }
    } else {
      switch (type) {
        case "primary":
          return "bg-blue-600 hover:bg-blue-700 text-white";
        case "success":
          return "bg-green-600 hover:bg-green-700 text-white";
        case "ghost":
          return "bg-gray-200 hover:bg-gray-300 text-black";
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
          <PlusOutlined /> Add card
        </Button>
      )}

      {showInput && (
        <>
          <Input
            autoFocus
            placeholder="Enter card title..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
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
