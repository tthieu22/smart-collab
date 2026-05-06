import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { firstValueFrom, timeout, retry } from 'rxjs';

import { DomainService } from './domain.service';
import { EventsPublisher } from './events.publisher';
import { PromptFactory } from './prompt.factory';
import { ScraperService } from './scraper.service';
import { DiscoveryService } from './discovery.service';
import { ImageService } from './image.service';
import { LlmService } from '../../project/internal/llm/llm.service';
import { ProjectService } from '../../project/project.service';
import { HomeService as GatewayHomeService } from '../../home/home.service';
import { AuthService } from '../../auth/auth.service';

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
export class InternalAiService {
  private readonly logger = new Logger(InternalAiService.name);

  constructor(
    private readonly domainService: DomainService,
    private readonly events: EventsPublisher,
    private readonly promptFactory: PromptFactory,
    private readonly scraperService: ScraperService,
    private readonly discoveryService: DiscoveryService,
    private readonly imageService: ImageService,
    private readonly llm: LlmService,

    private readonly projectGen: ProjectGenerator,
    private readonly boardGen: BoardGenerator,
    private readonly columnGen: ColumnGenerator,
    private readonly cardGen: CardGenerator,
    private readonly cardDetailGen: CardDetailGenerator,
    private readonly cardViewGen: CardViewGenerator,

    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService,
    @Inject(forwardRef(() => GatewayHomeService))
    private readonly homeService: GatewayHomeService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  private async rpc<T = any>(cmd: string, payload: any): Promise<T> {
    this.logger.log(`➡️ Bridge RPC -> ${cmd}`);

    if (cmd.startsWith('home.')) {
      return this.homeService.send({ cmd }, payload) as any;
    }
    if (cmd.startsWith('auth.')) {
      // Mapping for some auth bridge methods if needed
      if (cmd === 'auth.me') return this.authService.getCurrentUser(payload) as any;
      // ... more mappings can be added to AuthService bridge
      return (this.authService as any).handler.handleGeneric(cmd, payload) as any; // Fallback
    }
    
    return this.projectService.send({ cmd }, payload) as any;
  }

  private unwrap(res: any) {
    return res?.data ?? res;
  }

  private async createColumn(
    projectId: string,
    boardId: string,
    title: string,
    ownerId: string,
  ) {
    const res = await this.rpc('project.column.create', {
      projectId,
      createdById: ownerId,
      payload: { boardId, title },
    });

    return this.unwrap(res);
  }

  private async createCard(
    projectId: string,
    columnId: string,
    title: string,
    ownerId: string,
  ) {
    const res = await this.rpc('project.card.create', {
      projectId,
      userId: ownerId,
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
    // 2.5 FETCH USER INFO
    let userData: any = null;
    try {
      const authRes = await this.rpc('auth.me', { userId: payload.ownerId });
      userData = this.unwrap(authRes);
    } catch (err) {
      this.logger.warn(`Failed to fetch user info for ${payload.ownerId}: ${err}`);
    }

    const projectDto = this.projectGen.generate({
      name: domain.domain || 'Dự án mới',
      description: domain.description || 'Dự án được tạo tự động',
      ownerId: payload.ownerId,
      visibility: 'PRIVATE',
      userName: userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email : undefined,
      userAvatar: userData?.avatar,
      userEmail: userData?.email,
    } as any);

    const projectRes = await this.rpc<any>('project.create', projectDto);

    const { fullProject, defaultBoard } = this.unwrap(projectRes);
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
      payload.ownerId,
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

  async chat(payload: { question: string; userId?: string }) {
    this.logger.log(`AI Chat request: ${payload.question}`);

    // 1. Rewrite queries for better search context
    const rewritePrompt = `Bạn là chuyên gia về RAG. Hãy phân tích câu hỏi: "${payload.question}" và tạo ra tối đa 2 câu truy vấn tìm kiếm (tiếng Việt) để tìm context phù hợp nhất trong database tin tức của website. Trả về JSON array ["query1", "query2"]. Cần ngắn gọn, tập trung vào keywords. Nếu câu hỏi về website chung chung, hãy dùng các từ như "giới thiệu", "tóm tắt", "hướng dẫn".`;
    const rewriteRes = await this.llm.complete(rewritePrompt);
    let queries = [payload.question];
    try {
      const cleaned = rewriteRes.content.match(/\[.*\]/s)?.[0] || rewriteRes.content;
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) queries = [...new Set([...parsed, payload.question])];
    } catch {}

    // 2. Retrieval: Search for context from news
    let searchResults = await Promise.all(
      queries.map(q => this.rpc<any>('home.news.search', { q, limit: 3 }))
    );

    let rawArticles = searchResults.flatMap(r => r.data || []);

    // Fallback: If no news found, try a broad search for the platform name
    if (rawArticles.length === 0) {
      this.logger.log('No articles found, trying fallback search for "Smart Collab"');
      const fallbackRes = await this.rpc<any>('home.news.search', { q: 'Smart Collab', limit: 5 });
      rawArticles = fallbackRes.data || [];
    }

    // Deduplicate by ID
    const uniqueArticles = Array.from(new Map(rawArticles.map(a => [a.id, a])).values());

    // 3. Build Context
    const contextContent = uniqueArticles.length > 0 
      ? uniqueArticles.map(a => `### [Nguồn: ${a.title}]\n${a.content}`).join('\n\n').substring(0, 4000)
      : '(Hiện tại không tìm thấy bài viết tin tức cụ thể nào liên quan trực tiếp đến từ khóa này trong kho dữ liệu cục bộ)';

    const platformOverview = `Smart Collab là hệ thống quản lý công việc và cộng tác nhóm hiện đại, tích hợp AI mạnh mẽ để tự động hóa quy trình. 
Các tính năng chính: Bảng công việc (Board), Dashboard thông minh, Tự động hóa tạo bài viết (AutoPost), Chat AI hỗ trợ 24/7.`;

    // 4. Generation
    const systemPrompt = `Bạn là Smart AI - Một trợ lý ảo chuyên nghiệp, thân thiện và cực kỳ thông minh của hệ thống Smart Collab.

PHONG CÁCH PHẢN HỒI:
- Trả lời tự nhiên, trôi chảy như một chuyên gia thực thụ. Tránh cách nói rập khuôn "Tôi không tìm thấy thông tin trong CONTEXT".
- Nếu có thông tin trong CONTEXT, hãy lồng ghép khéo léo để trả lời.
- Nếu CONTEXT không đủ, hãy sử dụng kiến thức sâu rộng của bạn để giải đáp một cách linh hoạt, đồng thời kết nối nó với lợi ích mà Smart Collab có thể mang lại (nếu phù hợp).
- Luôn giữ thái độ sẵn sàng hỗ trợ và chuyên nghiệp.

NGỮ CẢNH HỆ THỐNG (Smart Collab Overview):
${platformOverview}

NGỮ CẢNH CHI TIẾT (Dựa trên dữ liệu tìm kiếm):
${contextContent}`;

    const answer = await this.llm.completeCustom(systemPrompt, payload.question);

    return {
      success: true,
      answer: answer.content,
      sources: uniqueArticles.slice(0, 3).map(a => ({ id: a.id, title: a.title })),
      timestamp: new Date().toISOString()
    };
  }

  async optimizePost(payload: { content: string; locale?: string }) {
    const locale = payload?.locale ?? 'vi';
    const prompt = `Bạn là một chuyên gia marketing và viết nội dung mạng xã hội. 
Hãy tối ưu hóa bài viết sau đây để trở nên thu hút, chuyên nghiệp và giàu cảm xúc hơn. 
Thêm các emoji phù hợp và tối đa 3-5 hashtag liên quan ở cuối.
Giữ nguyên ý nghĩa gốc và ngôn ngữ của bài viết.

Nội dung gốc:
"${payload.content}"

Hãy trả về TRỰC TIẾP nội dung bài viết đã được tối ưu, không cần lời dẫn.`;

    const aiRes = await this.llm.complete(prompt);
    return { success: true, content: aiRes.content.trim() };
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
      
      // Also get health status
      const healthRes = await this.analyzeProjectHealth({ 
        projectId: project.id, 
        userId: payload.userId,
        locale
      });

      return { 
        success: true, 
        analysis,
        health: healthRes.success ? healthRes.health : null
      };
    } catch (err) {
      this.logger.error('Parse board analysis failed', aiRes.content);
      return { success: false, message: 'AI analysis failed to parse' };
    }
  }

  async askBoard(payload: { boardId: string; query: string; userId?: string; locale?: string }) {
    const locale = payload?.locale ?? 'vi';
    const query = payload.query.toLowerCase();

    // 1. Get project data
    const boardRes = await this.rpc<any>('project.get', { 
      projectId: payload.boardId,
      userId: payload.userId 
    });
    const project = this.unwrap(boardRes);
    if (!project) return { success: false, message: 'Project not found' };

    let targetBoard = project.boards?.find((b: any) => b.id === payload.boardId);
    if (!targetBoard && project.boards?.length > 0) targetBoard = project.boards[0];
    if (!targetBoard) return { success: false, message: 'No board found' };

    // 2. Intelligent Filtering based on query
    // If project is huge, we don't send everything.
    // We pick cards that seem relevant to the query.
    const isMemberQuery = query.includes('thành viên') || query.includes('member') || query.includes('ai') || query.includes('người');
    const isDeadlineQuery = query.includes('hạn') || query.includes('ngày') || query.includes('deadline') || query.includes('khi nào');
    const isPriorityQuery = query.includes('ưu tiên') || query.includes('quan trọng') || query.includes('gấp');
    const isStatQuery = query.includes('thống kê') || query.includes('bao nhiêu') || query.includes('tổng');

    const filteredColumns = targetBoard.columns?.map((col: any) => {
      let cards = col.cards || [];
      
      // If query is specific, we can filter or just summarize cards
      if (cards.length > 20) {
        if (isMemberQuery) {
          // Keep cards with members or relevant titles
          cards = cards.filter((c: any) => c.members?.length > 0 || query.split(' ').some(q => c.title.toLowerCase().includes(q)));
        } else if (isDeadlineQuery) {
          cards = cards.filter((c: any) => c.deadline || c.startDate);
        } else if (isPriorityQuery) {
          cards = cards.filter((c: any) => c.priority >= 2);
        }
        
        // If still too many, just take top 15 and summarize the rest
        if (cards.length > 15) cards = cards.slice(0, 15);
      }

      return {
        title: col.title,
        cardCount: col.cards?.length || 0,
        cards: cards.map((card: any) => ({
          title: card.title,
          status: card.status,
          priority: card.priority,
          deadline: card.deadline,
          assignees: card.members?.length > 0 
            ? card.members.map((m: any) => m.userName) 
            : (card.createdByName ? [card.createdByName] : []),
          progress: card.checklist?.length ? Math.round((card.checklist.filter((i: any) => i.done).length / card.checklist.length) * 100) : 0
        }))
      };
    });

    // 3. Pre-calculate some stats to help AI
    const workload: Record<string, number> = {};
    const overdueTasks: string[] = [];
    const now = new Date();

    targetBoard.columns?.forEach((col: any) => {
      col.cards?.forEach((card: any) => {
        card.members?.forEach((m: any) => {
          workload[m.userName] = (workload[m.userName] || 0) + 1;
        });
        if (card.deadline && new Date(card.deadline) < now) {
          overdueTasks.push(card.title);
        }
      });
    });

    const context = {
      project: { name: project.name, description: project.description },
      boardTitle: targetBoard.title,
      query: payload.query,
      data: filteredColumns,
      insights: {
        memberWorkload: workload,
        overdueTasks: overdueTasks.slice(0, 10),
        totalCards: targetBoard.columns?.reduce((acc: number, c: any) => acc + (c.cards?.length || 0), 0)
      }
    };

    const prompt = this.promptFactory.askBoard(context, locale);
    const aiRes = await this.llm.complete(prompt);

    return { 
      success: true, 
      answer: aiRes.content,
      suggestedQueries: [
        "Những việc nào đang bị quá hạn?",
        "Ai đang phụ trách nhiều việc nhất?",
        "Tóm tắt tiến độ toàn bộ board"
      ]
    };
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
    const scrapedImages: string[] = [];
    
    // Scrape top 2 links to get more data
    for (const link of searchLinks.slice(0, 2)) {
      const { text, images } = await this.scraperService.scrapeUrl(link);
      if (text) {
        scrapedContent += `\n--- CONTENT FROM ${link} ---\n${text}\n`;
      }
      images.forEach(img => {
        if (!scrapedImages.includes(img)) scrapedImages.push(img);
      });
    }
    
    const context = {
      ...(payload?.context ?? {}),
      scraped_web_data: scrapedContent.substring(0, 5000), // Provide more data to AI
      scraped_images: scrapedImages.slice(0, 10) // Provide image candidates
    };

    const prompt = this.promptFactory.generateNewsPost(
      processedTemplate,
      context,
      locale,
    );
    const aiRes = await this.llm.complete(prompt);
    let rawContent = (aiRes.content || '').trim();
    this.logger.debug(`RAW AI RESPONSE: ${rawContent}`);
    
    let contentObj: any = {};
    
    // Defensive check: if it looks like JSON but has unescaped newlines, 
    // try to find the block and sanitize it roughly.
    const jsonStart = rawContent.indexOf('{');
    const jsonEnd = rawContent.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
       let potentialJson = rawContent.substring(jsonStart, jsonEnd + 1);
       try {
         contentObj = JSON.parse(potentialJson);
         this.logger.log('Successfully parsed JSON directly');
       } catch (err) {
         this.logger.warn(`Direct JSON parse failed: ${(err as any).message}. Attempting cleanup...`);
         // Attempt cleanup: Replace actual newlines inside what appears to be the JSON block
         try {
           const cleanedJson = potentialJson
             .replace(/\r?\n/g, '\\n') // Escape all newlines
             .replace(/\\n\s*"/g, '"') // Unescape if it was just before a property
             .replace(/"\s*\\n/g, '"'); // Unescape if it was just after a property
           
           // Actually, a safer way to clean "real" newlines in strings:
           const superCleaned = potentialJson.replace(/(?<=:.*")(\r?\n)(?=.*")/g, "\\n");
           
           contentObj = JSON.parse(superCleaned);
           this.logger.log('Successfully parsed JSON after string newline cleanup');
         } catch {
            // Last resort: extract fields via regex if JSON.parse keeps failing
            this.logger.error('Final JSON parse failed. Extracting fields via regex...');
            const titleMatch = potentialJson.match(/"title"\s*:\s*"([^"]+)"/);
            const contentMatch = potentialJson.match(/"content"\s*:\s*"([\s\S]+?)"(?=\s*(?:,|\}))/);
            const imageMatch = potentialJson.match(/"imageUrl"\s*:\s*"([^"]+)"/);
            const kwMatch = potentialJson.match(/"imageKeywords"\s*:\s*"([^"]+)"/);
            
            if (titleMatch) contentObj.title = titleMatch[1];
            if (contentMatch) contentObj.content = contentMatch[1].replace(/\\n/g, '\n').replace(/\n/g, ' ');
            if (imageMatch) contentObj.imageUrl = imageMatch[1];
            if (kwMatch) contentObj.imageKeywords = kwMatch[1];
         }
       }
    }

    this.logger.debug(`Parsed Content Object: ${JSON.stringify(contentObj)}`);

    if (!contentObj.content && rawContent.length > 200 && !rawContent.startsWith('{')) {
       this.logger.warn('AI did not return valid JSON content, using raw text as fallback');
       contentObj.content = rawContent; 
    }

    const looksLikeTemplate =
      !contentObj.content || 
      contentObj.content.length < 50 || 
      contentObj.content.toLowerCase().includes(processedTemplate.toLowerCase().substring(0, 20)) ||
      /\{\{\s*\w+\s*\}\}/i.test(contentObj.content);

    const result = {
      success: true,
      title: contentObj.title || 'Tin tức mới',
      content: typeof contentObj.content === 'string' ? contentObj.content : rawContent,
      imageUrl: contentObj.imageUrl || null,
      linkUrl: contentObj.linkUrl || (payload.context?.link as string) || null,
      imageKeywords: contentObj.imageKeywords || null
    };

    // --- RELEVANT IMAGE REFINEMENT ---
    if (!result.imageUrl || result.imageUrl.length < 5) {
       this.logger.log(`No direct image from AI, performing semantic search for: ${result.title}`);
       const relevantUrl = await this.imageService.searchRelevantImage({
          title: result.title,
          content: result.content,
          keywords: result.imageKeywords
       });
       if (relevantUrl) result.imageUrl = relevantUrl;
    }

    this.logger.log(`Returning generated news: ${result.title}`);
    return result;
  }

  async discoverContent(payload: { sources: string[]; strategy?: string; topic?: string }) {
    this.logger.log(`Discover content using strategy: ${payload.strategy || 'RSS'}`);
    
    // If MANUAL with specific topic, just return that topic and skip RSS
    if (payload.strategy === 'MANUAL' && payload.topic) {
      return { 
        success: true, 
        items: [{
          title: payload.topic,
          content: `Manual topic: ${payload.topic}`,
          link: '',
          source: 'MANUAL'
        }]
      };
    }

    const items = await this.discoveryService.discover(payload.sources);
    
    // Add trending topics if strategy is AI or MIXED
    if (payload.strategy === 'AI' || payload.strategy === 'MIXED') {
      const trends = await this.discoveryService.getTrendingTopics();
      trends.forEach(topic => {
        items.push({
          title: topic,
          content: `AI generated topic about ${topic}`,
          link: '',
          source: 'AI_TRENDS'
        });
      });
    }

    return { success: true, items };
  }

  async searchImages(payload: { query: string }) {
    this.logger.log(`Searching images for: ${payload.query}`);
    const urls = await this.imageService.searchImages(payload.query);
    return { success: true, urls };
  }

  async getEmbeddings(payload: { text: string }) {
    const vector = await this.llm.getEmbeddings(payload.text);
    return { success: true, vector };
  }

  private async generateBackground(
    project: any,
    boards: AiBoard[],
    domain: any,
    ownerId: string,
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
          const column = await this.createColumn(project.id, board.id, title, ownerId);

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
            const card = await this.createCard(project.id, column.id, title, ownerId);

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
              err as any,
            );
          }
        }
      }
    }

    this.events.projectBuilt(project.id);

    this.logger.log('AI PROJECT BUILD COMPLETED');
  }

  async generateSubtasks(payload: { cardId: string; userId: string; locale?: string }) {
    const locale = payload?.locale ?? 'vi';
    const cardRes = await this.rpc<any>('project.get.card', payload.cardId);
    const card = this.unwrap(cardRes);
    if (!card) return { success: false, message: 'Card not found' };

    const prompt = this.promptFactory.generateSubtasks(card, locale);
    const aiRes = await this.llm.complete(prompt);

    let subtasks = [];
    try {
      const parsed = JSON.parse(aiRes.content);
      subtasks = parsed.subtasks || [];
    } catch {
      return { success: false, message: 'AI failed to generate valid subtasks' };
    }

    // Persist into backend
    for (const sub of subtasks) {
      await this.rpc('project.card.update', {
        projectId: card.projectId,
        userId: payload.userId,
        payload: {
          cardId: card.id,
          action: 'add-checklist-item',
          data: { title: sub.title },
        },
      });
    }

    return { success: true, subtasks };
  }

  async predictTimeline(payload: { cardId: string; userId?: string; locale?: string }) {
    const locale = payload?.locale ?? 'vi';
    const cardRes = await this.rpc<any>('project.get.card', payload.cardId);
    const card = this.unwrap(cardRes);
    if (!card) return { success: false, message: 'Card not found' };

    const prompt = this.promptFactory.predictTimeline(card, locale);
    const aiRes = await this.llm.complete(prompt);

    try {
      const prediction = JSON.parse(aiRes.content);
      return { success: true, prediction };
    } catch {
      return { success: false, message: 'AI failed to predict timeline' };
    }
  }

  async analyzeProjectHealth(payload: { projectId: string; userId?: string; locale?: string }) {
    const locale = payload?.locale ?? 'vi';
    const projectRes = await this.rpc<any>('project.get', { projectId: payload.projectId, userId: payload.userId });
    const project = this.unwrap(projectRes);
    if (!project) return { success: false, message: 'Project not found' };

    // Calculate stats
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    const now = new Date();

    project.boards?.forEach((b: any) => {
      b.columns?.forEach((c: any) => {
        c.cards?.forEach((card: any) => {
          totalTasks++;
          if (c.title?.toLowerCase().includes('done') || c.title?.toLowerCase().includes('hoàn thành')) completedTasks++;
          if (card.deadline && new Date(card.deadline) < now) overdueTasks++;
        });
      });
    });

    const stats = { name: project.name, totalTasks, completedTasks, overdueTasks };
    const prompt = this.promptFactory.analyzeProjectHealth(stats, locale);
    const aiRes = await this.llm.complete(prompt);

    try {
      const health = JSON.parse(aiRes.content);
      // Update healthStatus in DB
      await this.rpc('project.update', {
        projectId: project.id,
        userId: payload.userId,
        payload: { healthStatus: health.status },
      });
      return { 
        success: true, 
        health: {
          ...health,
          insights: {
            completedTasks,
            totalTasks,
            overdueTasks
          }
        } 
      };
    } catch {
      return { success: false, message: 'AI health analysis failed' };
    }
  }

  async analyzeSentiment(payload: { projectId: string; userId: string; locale?: string }) {
    const locale = payload?.locale ?? 'vi';
    const projectRes = await this.rpc<any>('project.get', { projectId: payload.projectId, userId: payload.userId });
    const project = this.unwrap(projectRes);
    if (!project) return { success: false, message: 'Project not found' };

    // Collect comments
    const comments: any[] = [];
    project.boards?.forEach((b: any) => {
      b.columns?.forEach((c: any) => {
        c.cards?.forEach((card: any) => {
          if (card.comments) comments.push(...card.comments);
        });
      });
    });

    if (comments.length === 0) return { success: true, sentiment: 'NEUTRAL', summary: 'Không có bình luận nào để phân tích.' };

    const prompt = this.promptFactory.analyzeSentiment(comments.slice(-20), locale); // Last 20 comments
    const aiRes = await this.llm.complete(prompt);

    try {
      const result = JSON.parse(aiRes.content);
      return { success: true, ...result };
    } catch {
      return { success: false, message: 'AI sentiment analysis failed' };
    }
  }
}
