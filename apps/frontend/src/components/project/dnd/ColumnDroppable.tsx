"use client";
import { ReactNode } from "react";
import { Droppable } from "@hello-pangea/dnd";

interface ColumnDroppableProps {
  id: string; // columnId
  children: ReactNode;
}

export function ColumnDroppable({ id, children }: ColumnDroppableProps) {
  return (
    <Droppable droppableId={id} type="CARD">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex flex-col gap-2"
        >
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
