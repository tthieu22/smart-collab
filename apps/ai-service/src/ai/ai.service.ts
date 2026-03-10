import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, retry } from 'rxjs';

import { DomainService } from './domain.service';
import { EventsPublisher } from './events.publisher';
import type { BuildProjectOutput } from './contracts';

import {
  ProjectGenerator,
  BoardGenerator,
  ColumnGenerator,
  CardGenerator,
  CardDetailGenerator,
  CardViewGenerator,
} from './generators';

export interface AiBoard {
  id: string;
  title: string;
  type: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly domainService: DomainService,
    private readonly events: EventsPublisher,

    private readonly projectGen: ProjectGenerator,
    private readonly boardGen: BoardGenerator,
    private readonly columnGen: ColumnGenerator,
    private readonly cardGen: CardGenerator,
    private readonly cardDetailGen: CardDetailGenerator,
    private readonly cardViewGen: CardViewGenerator,

    @Inject('PROJECT_SERVICE')
    private readonly projectClient: ClientProxy,
  ) {}

  // =====================================================
  // RPC HELPERS
  // =====================================================
  private async rpc<T = any>(cmd: string, payload: any): Promise<T> {
    this.logger.log(`➡️ RPC -> ${cmd}`);
    this.logger.debug(`📦 Payload: ${JSON.stringify(payload)}`);

    return firstValueFrom(
      this.projectClient
        .send<T>({ cmd }, payload)
        .pipe(timeout(15_000), retry({ count: 2, delay: 500 })),
    );
  }

  // =====================================================
  // AI DOMAIN
  // =====================================================
  async analyzeDomain(payload: { prompt: string; locale?: string }) {
    this.logger.log('🧠 Analyze domain');
    return this.domainService.analyze(payload.prompt, payload.locale ?? 'vi');
  }

  // =====================================================
  // MAIN FLOW
  // =====================================================
  /**
   * Prompt
   * → Domain
   * → Project
   * → Board
   * → Column
   * → Card
   * → Detail
   * → View
   */
  async buildProject(
    payload: {
      prompt: string;
      ownerId: string;
      locale?: string;
    },
  ): Promise<BuildProjectOutput> {
    this.logger.log('🚀 AI BUILD PROJECT START');

    const domain = await this.domainService.analyze(
      payload.prompt,
      payload.locale ?? 'vi',
    );

    const projectDto = this.projectGen.generate({
      name: domain.domain,
      description: domain.description,
      ownerId: payload.ownerId,
      visibility: 'PRIVATE',
    });

    const projectRes = await this.rpc<{ success: boolean; data: any }>(
      'project.create',
      projectDto,
    );
    const project = projectRes.data;
    console.log(projectRes)
    const boardDtos = this.boardGen.generate({
      projectId: project.fullProject.id,
      ownerId: payload.ownerId,
      boards: project.defaultBoard,
    });

    const boards: AiBoard[] = [];
    for (const dto of boardDtos) {
      const res = await this.rpc<{ success: boolean; data: AiBoard }>(
        'board.create',
        dto,
      );
      boards.push(res.data);
    }

    this.events.boardReady(project, boards[0]);

    this.generateBackground(project, boards, domain).catch(err =>
      this.logger.error(err),
    );

    return {
      status: 'BOARD_READY',
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
      },
      board: {
        id: boards[0].id,
        title: boards[0].title,
        type: boards[0].type,
      },
    };
  }


  // =====================================================
  // BACKGROUND FLOW
  // =====================================================
  private async generateBackground(
    project: any,
    boards: AiBoard[],
    domain: any,
  ) {
    this.logger.log('⚙️ Background generation started');

    for (const board of boards) {
      // 5️⃣ Columns
      const columnDtos = this.columnGen.generate({
        projectId: project.id,
        boardId: board.id,
        columns: domain.columns,
      });

      for (const columnDto of columnDtos) {
        const colRes = await this.rpc<{ success: boolean; data: any }>(
          'column.create',
          columnDto,
        );
        const column = colRes.data;

        // 6️⃣ Cards
        const cardDtos = this.cardGen.generate({
          projectId: project.id,
          columnId: column.id,
          cards: domain.cards,
        });

        for (const cardDto of cardDtos) {
          const cardRes = await this.rpc<{ success: boolean; data: any }>(
            'card.create',
            cardDto,
          );
          const card = cardRes.data;

          // 7️⃣ Card details (checklist, label, priority, deadline)
          const detailDto = this.cardDetailGen.generate({
            cardId: card.id,
            details: domain.cardDetails,
          });

          await this.rpc('card.update-detail', detailDto);

          // 8️⃣ Card view
          const viewDto = this.cardViewGen.generate({
            projectId: project.id,
            cardId: card.id,
            columnId: column.id,
            componentType: 'board',
          });

          await this.rpc('card-view.create', viewDto);
        }
      }
    }

    // Final event
    this.events.projectBuilt(project.id);
    this.logger.log('AI PROJECT BUILD COMPLETED');
  }
}
