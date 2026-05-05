import { Injectable } from '@nestjs/common';

export interface CardViewGenInput {
  projectId: string;
  cardId: string;
  componentType: 'board' | 'inbox' | 'calendar';
  columnId?: string;
  position?: number;
  customTitle?: string;
}

@Injectable()
export class CardViewGenerator {
  generate(input: CardViewGenInput) {
    return {
      cardId: input.cardId,
      projectId: input.projectId,
      componentType: input.componentType,
      columnId: input.columnId ?? null,
      position: input.position ?? 0,
      version: 1,
      isPinned: false,
      customTitle: input.customTitle ?? null,
      metadata: null,
    };
  }
}
