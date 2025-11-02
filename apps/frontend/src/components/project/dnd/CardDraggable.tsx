"use client";
import { ReactNode } from "react";
import { Draggable } from "@hello-pangea/dnd";

interface CardDraggableProps {
  id: string;
  index: number;
  children: ReactNode;
}

export function CardDraggable({ id, index, children }: CardDraggableProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
           style={{
            ...provided.draggableProps.style, // **BẮT BUỘC phải có**
            userSelect: 'none',
          }}
        >
          {children}
        </div>
      )}
    </Draggable>
  );
}
