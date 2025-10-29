"use client";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useBoardStore } from "@smart/store/board";

export default function DragDropProvider({ children }: { children: React.ReactNode }) {
  const moveCard = useBoardStore(s => s.moveCard);
  const moveColumn = useBoardStore(s => s.moveColumn);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (type === "column") {
      moveColumn(draggableId, destination.droppableId, destination.index);
    } else {
      moveCard(draggableId, destination.droppableId, destination.droppableId.split("-")[0], destination.index);
    }
  };

  return <DragDropContext onDragEnd={onDragEnd}>{children}</DragDropContext>;
}
