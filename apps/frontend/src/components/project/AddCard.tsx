import { useState } from "react";
import { Input } from "@smart/components/ui/input";
import { CloseOutlined } from "@ant-design/icons";
import { useBoardStore } from "@smart/store/setting";
import { getProjectSocketManager } from "@smart/store/realtime";

interface AddCardProps {
  projectId: string;
  columnId: string;
}

export function AddCard({ projectId, columnId }: AddCardProps) {
  const theme = useBoardStore((state) => state.theme);
  const socketManager = getProjectSocketManager();

  const [newCardTitle, setNewCardTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newCardTitle.trim()) return;
    setLoading(true);

    try {
      await socketManager.createCard(
        projectId,
        columnId,
        newCardTitle.trim(),
        (res) => {
          if (res.status === "success" || res.card) {
            setNewCardTitle("");
          }
          setLoading(false);
        }
      );
    } catch (err) {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewCardTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ngăn chặn sự kiện nổi lên để tránh trùng với phím tắt của DnD-Kit (Space)
    if (e.key === " ") {
      e.stopPropagation();
    }

    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="min-w-[250px] relative flex-grow">
      <Input
        autoFocus
        placeholder="Enter card title..."
        value={newCardTitle}
        onChange={(e) => setNewCardTitle(e.target.value)}
        size="small"
        variant="filled"
        onKeyDown={handleKeyDown}
        style={{ paddingRight: 32 }}
      />
      {newCardTitle && (
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
  );
}
