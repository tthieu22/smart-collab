import { Injectable } from '@nestjs/common';

export interface BoardGenInput {
  projectId: string;
  ownerId: string;
  boards: Array<{
    title: string;
    type?: 'board';
    position?: number;
  }>;
}

@Injectable()
export class BoardGenerator {
  generate(input: BoardGenInput) {
    return input.boards.map((b, index) => ({
      projectId: input.projectId,
      ownerId: input.ownerId,
      title: b.title,
      type: b.type ?? 'board',
      position: b.position ?? index,
      columnIds: [],
    }));
  }
}
