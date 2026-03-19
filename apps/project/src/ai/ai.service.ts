import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, retry } from 'rxjs';

import { DomainService } from './domain.service';
import { EventsPublisher } from './events.publisher';
import { PromptFactory } from './prompt.factory';
import { LlmService } from '../llm/llm.service';

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
    private readonly promptFactory: PromptFactory,
    private readonly llm: LlmService,

    private readonly projectGen: ProjectGenerator,
    private readonly boardGen: BoardGenerator,
    private readonly columnGen: ColumnGenerator,
    private readonly cardGen: CardGenerator,
    private readonly cardDetailGen: CardDetailGenerator,
    private readonly cardViewGen: CardViewGenerator,

    @Inject('PROJECT_SERVICE')
    private readonly projectClient: ClientProxy,
  ) {}

  private async rpc<T = any>(cmd: string, payload: any): Promise<T> {
    this.logger.log(`➡️ RPC -> ${cmd}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

    return firstValueFrom(
      this.projectClient
        .send<T>({ cmd }, payload)
        .pipe(timeout(30000), retry({ count: 3, delay: 1000 })),
    );
  }

  private unwrap(res: any) {
    return res?.data ?? res;
  }

  private async createColumn(projectId: string, boardId: string, title: string) {
    const res = await this.rpc('project.column.create', {
      projectId,
      payload: { boardId, title },
    });

    return this.unwrap(res);
  }

  private async createCard(projectId: string, columnId: string, title: string) {
    const res = await this.rpc('project.card.create', {
      projectId,
      payload: { columnId, title },
    });

    return this.unwrap(res);
  }

  async analyzeDomain(payload: { prompt: string; locale?: string }) {
    this.logger.log('Analyze domain');
    return this.domainService.analyze(payload.prompt, payload.locale ?? 'vi');
  }

  async buildProject(
    payload: {
      prompt: string;
      ownerId: string;
      locale?: string;
    },
  ): Promise<BuildProjectOutput> {
    this.logger.log('AI BUILD PROJECT START');
    const locale = payload?.locale ?? 'vi';

    /* 1️⃣ DOMAIN ANALYSIS */

    const domain = await this.analyzeDomain(payload);

    /* 2️⃣ GENERATE PROJECT INFO FROM AI */

    const projectPrompt = this.promptFactory.generateProject(domain, locale);

    const projectAiRes = await this.llm.complete(projectPrompt);

    let projectData: any = {
      name: domain.domain || 'Dự án mới',
      description: domain.description || 'Dự án được tạo tự động',
      visibility: 'PRIVATE',
    };

    try {
      projectData = JSON.parse(projectAiRes.content);
    } catch (err) {
      this.logger.warn('Parse project JSON failed → using fallback');
    }
    const projectDto = this.projectGen.generate({
      name: domain.domain || 'Dự án mới',
      description: domain.description || 'Dự án được tạo tự động',
      ownerId: payload.ownerId,
      visibility: 'PRIVATE',
    });

    const projectRes = await this.rpc<any>('project.create', projectDto);

    const { fullProject, defaultBoard } = projectRes.data;
    const project = fullProject;

    const boards: AiBoard[] = [
      {
        id: defaultBoard.id,
        title: defaultBoard.title,
        type: defaultBoard.type,
      },
    ];

    this.events.boardReady(project, boards[0]);

    this.generateBackground(project, boards, domain, payload.locale ?? 'vi')
      .catch(err => this.logger.error('Background generation failed', err));

    return {
      status: 'BOARD_READY',
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
      },
      board: boards[0],
    };
  }

  private async generateBackground(
    project: any,
    boards: AiBoard[],
    domain: any,
    locale: string = 'vi',
  ) {
    this.logger.log('Background AI generation started');

    for (const board of boards) {

      /* GENERATE COLUMNS */

      const columnPrompt = this.promptFactory.generateColumns(
        board,
        project,
        domain,
        locale,
      );

      const columnAiRes = await this.llm.complete(columnPrompt);

      let columnsData = { columns: [] };

      try {
        columnsData = JSON.parse(columnAiRes.content);
      } catch {
        this.logger.error('Parse columns JSON failed');
      }

      let columnTitles = (columnsData.columns || []).map((c: any, idx: number) =>
        String(c.title || `Cột ${idx + 1}`).trim(),
      );

      if (columnTitles.length === 0) {
        this.logger.warn('No AI columns → using fallback');
        columnTitles = ['To Do', 'In Progress', 'Done'];
      }

      const createdColumns: any[] = [];

      for (const title of columnTitles) {
        try {
          const column = await this.createColumn(project.id, board.id, title);

          if (column) {
            this.logger.debug(`Column created: ${JSON.stringify(column)}`);
            createdColumns.push(column);
          }

        } catch (err) {
          this.logger.error(`Create column failed: ${title}`, err);
        }
      }

      /* GENERATE CARDS */

      for (const column of createdColumns) {

        const cardPrompt = this.promptFactory.generateCards(
          board,
          column,
          domain,
          locale,
        );

        const cardAiRes = await this.llm.complete(cardPrompt);

        let cardsData = { cards: [] };

        try {
          cardsData = JSON.parse(cardAiRes.content);
        } catch {
          this.logger.error('Parse cards JSON failed');
        }

        const cardTitles = (cardsData.cards || []).map((c: any, idx: number) =>
          String(c.title || `Công việc ${idx + 1}`).trim(),
        );

        for (const title of cardTitles) {

          try {

            const card = await this.createCard(project.id, column.id, title);

            // if (!card) continue;

            /* CARD DETAILS */

            // const detailPrompt = this.promptFactory.generateCardDetails(
            //   card,
            //   locale,
            // );

            // const detailAiRes = await this.llm.complete(detailPrompt);

            // let detailData = {};

            // try {
            //   detailData = JSON.parse(detailAiRes.content);
            // } catch {}

            // await this.rpc('card.update-detail', {
            //   cardId: card.id,
            //   details: detailData,
            // });

            // /* CARD VIEW */

            // const viewPrompt = this.promptFactory.generateCardView(
            //   card,
            //   locale,
            // );

            // const viewAiRes = await this.llm.complete(viewPrompt);

            // let viewData = {};

            // try {
            //   viewData = JSON.parse(viewAiRes.content);
            // } catch {}

            // await this.rpc('card-view.create', {
            //   projectId: project.id,
            //   cardId: card.id,
            //   columnId: column.id,
            //   componentType: 'board',
            //   ...viewData,
            // });

          } catch (err) {
            this.logger.error(
              `Card generation failed in column ${column.title}`,
              err,
            );
          }
        }
      }
    }

    this.events.projectBuilt(project.id);

    this.logger.log('AI PROJECT BUILD COMPLETED');
  }
}