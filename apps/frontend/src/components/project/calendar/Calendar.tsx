"use client";

import { useState } from "react";
import { ContainerDroppable } from "@smart/components/project/dnd/ContainerDroppable";
import { CardDraggable } from "@smart/components/project/dnd/CardDraggable";
import { Card as CardType } from "@smart/types/project";
import { projectStore } from "@smart/store/project";

export default function Calendar({ cards }: { cards?: CardType[] }) {
  const addCardStore = projectStore((state) => state.addCard);
  const updateCardStore = projectStore((state) => state.updateCard);
  const currentProject = projectStore((state) => state.currentProject);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState("unscheduled");

  if (!currentProject) return <div>Không có dự án</div>;

  // Lấy các thẻ từ prop hoặc project store
  const displayCards =
    cards ?? currentProject.cards ?? [];

  // Gom các thẻ theo ngày (deadline)
  const cardsByDate: Record<string, CardType[]> = {};
  displayCards.forEach((card) => {
    const day = card.deadline ? card.deadline.split("T")[0] : "unscheduled";
    if (!cardsByDate[day]) cardsByDate[day] = [];
    cardsByDate[day].push(card);
  });

  const handleAddCard = () => {
    if (!newCardTitle.trim() || !currentProject) return;
    const now = new Date().toISOString();
    addCardStore(currentProject.id, {
      id: crypto.randomUUID(),
      projectId: currentProject.id,
      title: newCardTitle,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
      deadline: selectedDate === "unscheduled" ? undefined : selectedDate,
      columnId: "calendar",
    } as CardType);
    setNewCardTitle("");
  };

  return (
    <div>
      {/* Chọn ngày thêm thẻ */}
      <div className="flex gap-2 mb-2">
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="unscheduled">Unscheduled</option>
          {Object.keys(cardsByDate)
            .filter((d) => d !== "unscheduled")
            .sort()
            .map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
        </select>
        <input
          type="text"
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          placeholder="New Card"
          className="border rounded px-2 py-1 flex-1 text-sm"
        />
        <button
          onClick={handleAddCard}
          className="bg-blue-500 text-white rounded px-3 py-1 text-sm"
        >
          Add
        </button>
      </div>

      {/* Cột ngày */}
      <div className="flex gap-4 overflow-x-auto">
        {Object.keys(cardsByDate)
          .sort((a, b) => (a === "unscheduled" ? 1 : b === "unscheduled" ? -1 : a.localeCompare(b)))
          .map((dateKey) => (
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
            </ContainerDroppable>
          ))}
      </div>
    </div>
  );
}
