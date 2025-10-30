"use client";

import { ContainerDroppable } from "@smart/components/project/dnd/ContainerDroppable";
import { CardDraggable } from "@smart/components/project/dnd/CardDraggable";
import { projectStore } from "@smart/store/project";
import { AddCard } from "@smart/components/project/AddCard";
import type { Card as CardType } from "@smart/types/project";

interface CalendarProps {
  cards?: CardType[];
  className?: string;
}

export default function Calendar({ cards, className }: CalendarProps) {
  const currentProject = projectStore((s) => s.currentProject);
  const cardsStore = projectStore((s) => s.cards);

  if (!currentProject) return <div>Không có dự án</div>;

  const displayCards: CardType[] =
    cards ?? Object.values(cardsStore).filter(c => c.projectId === currentProject.id);

  const cardsByDate: Record<string, CardType[]> = {};
  displayCards.forEach(card => {
    const day = card.deadline ? card.deadline.split("T")[0] : "unscheduled";
    if (!cardsByDate[day]) cardsByDate[day] = [];
    cardsByDate[day].push(card);
  });

  return (
    <div>
      <div className={`flex gap-4 overflow-x-auto ${className ?? ""}`}>
        {Object.keys(cardsByDate)
          .sort((a, b) =>
            a === "unscheduled" ? 1 : b === "unscheduled" ? -1 : a.localeCompare(b)
          )
          .map(dateKey => (
            <ContainerDroppable
              key={dateKey}
              id={dateKey}
              className="min-w-[250px] border rounded p-2 flex flex-col gap-2 bg-gray-50"
            >
              <div className="font-semibold mb-2">
                {dateKey === "unscheduled" ? "Unscheduled" : dateKey}
              </div>

              {cardsByDate[dateKey].map((card, index) => (
                <CardDraggable key={card.id} id={card.id} index={index}>
                  {card.title}
                </CardDraggable>
              ))}

              {dateKey !== "unscheduled" && (
                <AddCard projectId={currentProject.id} columnId={dateKey} />
              )}
            </ContainerDroppable>
          ))}
      </div>
    </div>
  );
}
