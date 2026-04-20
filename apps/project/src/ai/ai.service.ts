import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, retry } from 'rxjs';

import { DomainService } from './domain.service';
import { EventsPublisher } from './events.publisher';
import { PromptFactory } from './prompt.factory';
import { ScraperService } from './scraper.service';
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
    private readonly scraperService: ScraperService,
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

  private async createColumn(
    projectId: string,
    boardId: string,
    title: string,
  ) {
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

  async buildProject(payload: {
    prompt: string;
    ownerId: string;
    locale?: string;
  }): Promise<BuildProjectOutput> {
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

    this.generateBackground(
      project,
      boards,
      domain,
      payload.locale ?? 'vi',
    ).catch((err) => this.logger.error('Background generation failed', err));

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

  async generateCard(payload: {
    cardId: string;
    type: 'title' | 'description' | 'comment';
    userId: string;
    locale?: string;
  }) {
    const locale = payload?.locale ?? 'vi';
    const cardRes = await this.rpc<any>('project.get.card', payload.cardId);
    const card = this.unwrap(cardRes);
    if (!card) {
      return { success: false, message: 'Card not found' };
    }

    let prompt = '';
    if (payload.type === 'title')
      prompt = this.promptFactory.generateCardTitle(card, locale);
    if (payload.type === 'description')
      prompt = this.promptFactory.generateCardDescription(card, locale);
    if (payload.type === 'comment')
      prompt = this.promptFactory.generateCardComment(card, locale);

    const aiRes = await this.llm.complete(prompt);

    let content = '';
    try {
      const parsed = JSON.parse(aiRes.content);
      content = String(parsed?.content ?? '').trim();
    } catch {
      content = String(aiRes.content ?? '').trim();
    }

    if (!content) {
      return { success: false, message: 'Empty AI content' };
    }

    // Persist into backend immediately
    if (payload.type === 'title') {
      await this.rpc('project.card.update', {
        projectId: card.projectId,
        userId: payload.userId,
        payload: {
          cardId: card.id,
          action: 'update-basic',
          data: { title: content },
        },
      });
    } else if (payload.type === 'description') {
      await this.rpc('project.card.update', {
        projectId: card.projectId,
        userId: payload.userId,
        payload: {
          cardId: card.id,
          action: 'update-basic',
          data: { description: content },
        },
      });
    } else if (payload.type === 'comment') {
      await this.rpc('project.card.update', {
        projectId: card.projectId,
        userId: payload.userId,
        payload: {
          cardId: card.id,
          action: 'add-comment',
          data: {
            content,
            userName: 'AI',
            avatar: null,
          },
        },
      });
    }

    return { success: true, type: payload.type, content };
  }

  async analyzeBoard(payload: { boardId: string; userId?: string; locale?: string }) {
    const locale = payload?.locale ?? 'vi';
    
    // 1. Get all data for the board
    const boardRes = await this.rpc<any>('project.get', { 
      projectId: payload.boardId,
      userId: payload.userId 
    });
    const project = this.unwrap(boardRes);
    
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    // 2. Find the target board in the project structure
    // If payload.boardId is a project ID, take the first board. 
    // If it's a board ID, find it.
    let targetBoard = project.boards?.find((b: any) => b.id === payload.boardId);
    if (!targetBoard && project.boards?.length > 0) {
      targetBoard = project.boards[0];
    }

    if (!targetBoard) {
      return { success: false, message: 'No board found in project' };
    }

    // Prepare a simplified version of the board for AI
    const boardData = {
      title: targetBoard.title,
      description: project.description,
      columns: targetBoard.columns?.map((col: any) => ({
        title: col.title,
        cards: col.cards?.map((card: any) => ({
          title: card.title,
          status: card.status,
          priority: card.priority,
          deadline: card.deadline,
          members: card.members?.map((m: any) => m.userName),
          labelCount: card.labels?.length || 0,
          checklistCount: card.checklist?.length || 0,
          checklistDone: card.checklist?.filter((i: any) => i.done).length || 0
        })) || []
      })) || []
    };

    const prompt = this.promptFactory.analyzeBoard(boardData, locale);
    const aiRes = await this.llm.complete(prompt);

    try {
      const analysis = JSON.parse(aiRes.content);
      return { success: true, analysis };
    } catch (err) {
      this.logger.error('Parse board analysis failed', aiRes.content);
      return { success: false, message: 'AI analysis failed to parse' };
    }
  }

  async generateNewsPost(payload: {
    template: string;
    context?: Record<string, unknown>;
    locale?: string;
  }) {
    const locale = payload?.locale ?? 'vi';
    let processedTemplate = payload.template;
    if (payload?.context) {
      Object.entries(payload.context).forEach(([key, val]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
        processedTemplate = processedTemplate.replace(regex, String(val));
      });
    }

    // --- SCRAPING LOGIC ---
    this.logger.log(`Performing web search/scrape for: ${processedTemplate}`);
    const searchLinks = await this.scraperService.searchLinks(processedTemplate);
    let scrapedContent = '';
    
    // Scrape top 2 links to get more data
    for (const link of searchLinks.slice(0, 2)) {
      const pageText = await this.scraperService.scrapeUrl(link);
      if (pageText) {
        scrapedContent += `\n--- CONTENT FROM ${link} ---\n${pageText}\n`;
      }
    }
    
    const context = {
      ...(payload?.context ?? {}),
      scraped_web_data: scrapedContent.substring(0, 5000) // Provide more data to AI
    };

    const prompt = this.promptFactory.generateNewsPost(
      processedTemplate,
      context,
      locale,
    );
    const aiRes = await this.llm.complete(prompt);
    let content = '';
    let contentObj: any = {};
    try {
      contentObj = JSON.parse(aiRes.content);
      content = String(contentObj?.content ?? '').trim();
    } catch {
      content = String(aiRes.content ?? '').trim();
    }

    const looksLikeTemplate =
      !content || 
      content.length < 20 || 
      content.toLowerCase().includes(processedTemplate.toLowerCase().substring(0, 20)) ||
      /\{\{\s*\w+\s*\}\}/i.test(content);

    if (looksLikeTemplate) {
      return {
        success: false,
        message: 'LLM did not return usable news body (empty or template-like)',
      };
    }

    return {
      success: true,
      title: contentObj.title || 'Tin tức mới',
      content: contentObj.content || content,
      imageUrl: contentObj.imageUrl || null,
      linkUrl: contentObj.linkUrl || null
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

      let columnTitles = (columnsData.columns || []).map(
        (c: any, idx: number) => String(c.title || `Cột ${idx + 1}`).trim(),
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
