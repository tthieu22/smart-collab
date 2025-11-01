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
    <div
      className={`
        flex flex-col min-w-[260px] max-w-[280px] rounded-2xl shadow-md border
        bg-white/30 border-white/20 text-gray-900
        hover:shadow-lg transition-all duration-300 backdrop-blur-sm
        dark:bg-black/30 dark:border-black/20 dark:text-gray-100
        text-sm
      `}
    >
      {/* Header */}
      <div
        className={`
          px-4 py-2 rounded-t-2xl font-semibold flex items-center justify-between
          bg-white/40 text-gray-800 border-b border-white/30
          dark:bg-black/40 dark:text-gray-200 dark:border-black/30
          select-none
        `}
      >
        <span className="truncate">{column.title}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{cards.length}</span>
      </div>

      {/* Cards list */}
      <ColumnDroppable id={column.id}>
        <div className="flex flex-col gap-2 p-3 overflow-y-auto max-h-[60vh]">
          {cards.length > 0 ? (
            cards.map((c, i) => <Card key={c.id} card={c} index={i} />)
          ) : (
            <div className="text-center text-gray-400 dark:text-gray-600 italic select-none text-xs">
              No cards yet
            </div>
          )}
        </div>
      </ColumnDroppable>

      {/* Add Card */}
      {currentProject && (
        <div className="p-3 border-t border-white/20 dark:border-black/20">
          <AddCard projectId={currentProject.id} columnId={column.id} />
        </div>
      )}
    </div>
  );
}
