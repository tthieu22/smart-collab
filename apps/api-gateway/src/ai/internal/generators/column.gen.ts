import { Injectable } from '@nestjs/common';

export interface ColumnGenInput {
  projectId: string;
  boardId: string;
  columns: Array<{
    title: string;
    position?: number;
  }>;
}

@Injectable()
export class ColumnGenerator {
  generate(input: ColumnGenInput) {
    return input.columns.map((col, index) => ({
      projectId: input.projectId,
      boardId: input.boardId,
      title: col.title,
      position: col.position ?? index,
      metadata: null,
    }));
  }
}
