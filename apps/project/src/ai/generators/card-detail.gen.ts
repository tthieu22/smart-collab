import { Injectable } from '@nestjs/common';

export interface CardDetailGenInput {
  cardId: string;
  details: {
    priority?: number;
    deadline?: Date | string;
    labels?: string[];
    checklist?: string[];
  };
}

@Injectable()
export class CardDetailGenerator {
  generate(input: CardDetailGenInput) {
    const { cardId, details } = input;

    return {
      updateCard: {
        where: { id: cardId },
        data: {
          priority: details.priority ?? null,
          deadline: details.deadline
            ? new Date(details.deadline)
            : null,
        },
      },

      labels: (details.labels ?? []).map(label => ({
        cardId,
        label,
      })),

      checklist: (details.checklist ?? []).map((title, index) => ({
        cardId,
        title,
        position: index,
      })),
    };
  }
}
