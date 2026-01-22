import { Injectable } from '@nestjs/common';

export interface ProjectGenInput {
  name: string;
  description?: string;
  ownerId: string;
  visibility?: 'PRIVATE' | 'PUBLIC';
  color?: string;
  background?: string;
}

@Injectable()
export class ProjectGenerator {
  generate(input: ProjectGenInput) {
    return {
      name: input.name,
      description: input.description ?? null,
      ownerId: input.ownerId,
      visibility: input.visibility ?? 'PRIVATE',
      color: input.color ?? null,
      background: input.background ?? null,
    };
  }
}
