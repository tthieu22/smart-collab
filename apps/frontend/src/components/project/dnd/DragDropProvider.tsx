"use client";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { projectStore } from "@smart/store/project";

interface Props {
  children: React.ReactNode;
}

export default function DragDropProvider({ children }: Props) {
  const moveCard = projectStore((s) => s.moveCard);
  const moveColumn = projectStore((s) => s.moveColumn);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;

    if (type === "COLUMN") {
      // Tham số: columnId, destBoardId, destIndex
    //   moveColumn(draggableId, destination.droppableId, destination.index);
    }

    if (type === "CARD") {
      // Tham số: cardId, destColumnId, destIndex
    //   moveCard(draggableId, destination.droppableId, destination.index);
    }
  };

  return <DragDropContext onDragEnd={onDragEnd}>{children}</DragDropContext>;
}
