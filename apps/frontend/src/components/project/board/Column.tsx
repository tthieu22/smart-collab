"use client";

import { Column as ColumnType } from "@smart/types/project";
import { ColumnDroppable } from "@smart/components/project/dnd/ColumnDroppable";
import { Card } from "./Card";
import { projectStore } from "@smart/store/project";
import { AddCard } from "@smart/components/project/AddCard";

interface ColumnProps {
  column: ColumnType;
}

export default function Column({ column }: ColumnProps) {
  const currentProject = projectStore((state) => state.currentProject);
  const cardsStore = projectStore((state) => state.cards);

  const cards = column.cardIds.map((id) => cardsStore[id]).filter(Boolean);

  return (
    <div className="bg-gray-100 rounded p-2 min-w-[200px] flex flex-col">
      <h3 className="font-bold mb-2">{column.title}</h3>

      <ColumnDroppable id={column.id}>
        {cards.map((c, i) => (
          <Card key={c.id} card={c} index={i} />
        ))}
      </ColumnDroppable>

      {currentProject && (
        <AddCard projectId={currentProject.id} columnId={column.id} />
      )}
    </div>
  );
}
