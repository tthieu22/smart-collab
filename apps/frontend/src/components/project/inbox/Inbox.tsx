"use client";

import { ContainerDroppable } from "@smart/components/project/dnd/ContainerDroppable";
import { CardDraggable } from "@smart/components/project/dnd/CardDraggable";
import { projectStore } from "@smart/store/project";
import { AddCard } from "@smart/components/project/AddCard";
import type { Card as CardType } from "@smart/types/project";

interface InboxProps {
  cards?: CardType[];
  className?: string;
}

export default function Inbox({ cards, className }: InboxProps) {
  const currentProject = projectStore((s) => s.currentProject);
  const cardsStore = projectStore((s) => s.cards);

  if (!currentProject) return <div>Không có dự án</div>;

  // Nếu prop cards không truyền, lấy từ store
  const displayCards: CardType[] =
    cards ?? Object.values(cardsStore).filter(c => c.projectId === currentProject.id && c.columnId === "inbox");

  return (
    <div>
      <ContainerDroppable id="inbox" className={`flex flex-col gap-2 ${className ?? ""}`}>
        {displayCards.map((c, i) => (
          <CardDraggable key={c.id} id={c.id} index={i}>
            {c.title}
          </CardDraggable>
        ))}
      </ContainerDroppable>

      <AddCard projectId={currentProject.id} columnId="inbox" />
    </div>
  );
}
