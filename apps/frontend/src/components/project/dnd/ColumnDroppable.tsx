"use client";
import { ReactNode } from "react";
import { Droppable } from "@hello-pangea/dnd";
import clsx from "clsx";

interface ColumnDroppableProps {
  id: string; // columnId
  children: ReactNode;
  className?: string;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
}

export function ColumnDroppable({
  id,
  children,
  className,
  onDragEnter,
  onDragLeave,
}: ColumnDroppableProps) {
  return (
    <Droppable droppableId={id} type="CARD">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          className={clsx(
            "flex flex-col gap-2 p-3 rounded-b-2xl transition-all duration-200 scrollbar-hide",
            snapshot.isDraggingOver
              ? "bg-white/40 dark:bg-black/40 ring-2 ring-blue-400/40 dark:ring-blue-500/30"
              : "bg-transparent",
            className
          )}
        >
          {children}

          {/* giữ placeholder nhưng ẩn padding ảnh hưởng layout */}
          <div
            style={{
              height:
                snapshot.isDraggingOver && provided.placeholder
                  ? 0
                  : undefined,
            }}
          >
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}
