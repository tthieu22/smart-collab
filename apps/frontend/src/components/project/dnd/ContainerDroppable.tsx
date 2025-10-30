"use client";
import { ReactNode } from "react";
import { Droppable } from "@hello-pangea/dnd";

interface ContainerDroppableProps {
  id: string; // boardId hoặc projectId
  children: ReactNode;
  className?: string;
  type?: "BOARD" | "COLUMN" | "CARD";
}

export function ContainerDroppable({
  id,
  children,
  className,
  type = "CARD",
}: ContainerDroppableProps) {
  return (
    <Droppable droppableId={id} type={type}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className={className}>
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
