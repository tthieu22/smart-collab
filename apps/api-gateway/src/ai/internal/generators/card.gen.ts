import { Injectable } from '@nestjs/common';

export interface CardGenInput {
  projectId: string;
  columnId: string;
  cards: Array<{
    title: string;
    description?: string;
    status?: string;
  }>;
}

@Injectable()
export class CardGenerator {
  generate(input: CardGenInput) {
    return input.cards.map((card, index) => ({
      projectId: input.projectId,
      columnId: input.columnId,
      title: card.title,
      description: card.description ?? null,
      status: card.status ?? 'ACTIVE',
      position: index,
    }));
  }
}
