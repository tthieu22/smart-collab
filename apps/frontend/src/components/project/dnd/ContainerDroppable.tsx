"use client";
import { ReactNode } from "react";
import { Droppable } from "@hello-pangea/dnd";

interface ContainerDroppableProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function ContainerDroppable({ id, children, className }: ContainerDroppableProps) {
  return (
    <Droppable droppableId={id} type="CARD">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className={className}>
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
