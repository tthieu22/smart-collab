"use client";
import { ReactNode } from "react";
import { Droppable } from "@hello-pangea/dnd";

interface ContainerDroppableProps {
  id: string; // boardId hoặc projectId
  children: ReactNode;
  className?: string;
  type?: "BOARD" | "COLUMN" | "CARD";
  style?: React.CSSProperties;
}

export function ContainerDroppable({
  id,
  children,
  className,
  type = "CARD",
  style,  // thêm vào đây
}: ContainerDroppableProps) {
  return (
    <Droppable droppableId={id} type={type}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={className}
          style={style}  // dùng style đúng chỗ
        >
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
