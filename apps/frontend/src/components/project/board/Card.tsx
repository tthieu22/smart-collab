"use client";
import { Card as CardType } from "@smart/types/project";
import { CardDraggable } from "@smart/components/project/dnd/CardDraggable";

interface CardProps {
  card: CardType;
  index: number;
}

export function Card({ card, index }: CardProps) {
  return <CardDraggable id={card.id} index={index}>{card.title}</CardDraggable>;
}
