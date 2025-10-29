"use client";

import { ContainerDroppable } from "@smart/components/project/dnd/ContainerDroppable";
import { CardDraggable } from "@smart/components/project/dnd/CardDraggable";
import { Card as CardType } from "@smart/types/project";
import { projectStore } from "@smart/store/project";
import { AddCard } from "@smart/components/project/AddCard";

export default function Inbox({ cards }: { cards?: CardType[] }) {
  const currentProject = projectStore((state) => state.currentProject);

  // Nếu không truyền cards từ props, lấy từ store
  const displayCards =
    cards ?? currentProject?.cards?.filter((c) => c.columnId === "inbox") ?? [];

  return (
    <div>
      <ContainerDroppable id="inbox" className="flex flex-col gap-2">
        {displayCards.map((c, i) => (
          <CardDraggable key={c.id} id={c.id} index={i}>
            {c.title}
          </CardDraggable>
        ))}
      </ContainerDroppable>

      {/* Sử dụng AddCard */}
      {currentProject && (
        <AddCard projectId={currentProject.id} columnId="inbox" />
      )}
    </div>
  );
}
