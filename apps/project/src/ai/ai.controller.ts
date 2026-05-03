import { Controller, Logger, OnModuleInit } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AiService } from './ai.service';
import { HomeService } from '../../../auth/src/modules/home/services/home.service';
import { SocialService } from '../../../auth/src/modules/home/services/social.service';

import type {
  AnalyzeDomainInput,
  AnalyzeDomainOutput,
  BuildProjectInput,
  BuildProjectOutput,
} from './contracts';

@Controller()
export class AiController implements OnModuleInit {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly homeService: HomeService,
    private readonly socialService: SocialService,
  ) {}

  onModuleInit() {
    this.logger.log('🚀 AiController initialized - Home search handlers ready');
  }

  @MessagePattern({ cmd: 'ai.analyze-domain' })
  async analyzeDomain(
    @Payload() payload: AnalyzeDomainInput,
  ): Promise<AnalyzeDomainOutput> {
    this.logger.log('[ai.analyze-domain]');
    return this.aiService.analyzeDomain(payload);
  }

  @MessagePattern({ cmd: 'ai.build-project' })
  async buildProject(
    @Payload() payload: BuildProjectInput,
  ): Promise<BuildProjectOutput> {
    this.logger.log('[ai.build-project]');
    return this.aiService.buildProject(payload);
  }

  @MessagePattern({ cmd: 'ai.generate-card' })
  async generateCard(@Payload() payload: any) {
    this.logger.log('[ai.generate-card]');
    return this.aiService.generateCard(payload);
  }

  @MessagePattern({ cmd: 'ai.generate-news-post' })
  async generateNewsPost(@Payload() payload: any) {
    this.logger.log('[ai.generate-news-post]');
    return this.aiService.generateNewsPost(payload);
  }

  @MessagePattern({ cmd: 'ai.analyze-board' })
  async analyzeBoard(@Payload() payload: any) {
    this.logger.log('[ai.analyze-board]');
    return this.aiService.analyzeBoard(payload);
  }

  @MessagePattern({ cmd: 'ai.ask-board' })
  async askBoard(@Payload() payload: any) {
    this.logger.log('[ai.ask-board]');
    return this.aiService.askBoard(payload);
  }

  @MessagePattern({ cmd: 'ai.discover-content' })
  async discoverContent(@Payload() payload: any) {
    this.logger.log('[ai.discover-content]');
    return this.aiService.discoverContent(payload);
  }

  @MessagePattern({ cmd: 'ai.search-images' })
  async searchImages(@Payload() payload: any) {
    this.logger.log('[ai.search-images]');
    return this.aiService.searchImages(payload);
  }

  @MessagePattern({ cmd: 'ai.get-embeddings' })
  async getEmbeddings(@Payload() payload: any) {
    this.logger.log('[ai.get-embeddings]');
    return this.aiService.getEmbeddings(payload);
  }

  @MessagePattern({ cmd: 'ai.chat' })
  async chat(@Payload() payload: any) {
    this.logger.log('[ai.chat]');
    return this.aiService.chat(payload);
  }

  @MessagePattern({ cmd: 'ai.optimize-post' })
  async optimizePost(@Payload() payload: any) {
    this.logger.log('[ai.optimize-post]');
    return this.aiService.optimizePost(payload);
  }

  @MessagePattern({ cmd: 'ai.generate-subtasks' })
  async generateSubtasks(@Payload() payload: any) {
    this.logger.log('[ai.generate-subtasks]');
    return this.aiService.generateSubtasks(payload);
  }

  @MessagePattern({ cmd: 'ai.predict-timeline' })
  async predictTimeline(@Payload() payload: any) {
    this.logger.log('[ai.predict-timeline]');
    return this.aiService.predictTimeline(payload);
  }

  @MessagePattern({ cmd: 'ai.analyze-project-health' })
  async analyzeProjectHealth(@Payload() payload: any) {
    this.logger.log('[ai.analyze-project-health]');
    return this.aiService.analyzeProjectHealth(payload);
  }

  @MessagePattern({ cmd: 'ai.analyze-sentiment' })
  async analyzeSentiment(@Payload() payload: any) {
    this.logger.log('[ai.analyze-sentiment]');
    return this.aiService.analyzeSentiment(payload);
  }

  @MessagePattern({ cmd: 'home.news.search' })
  @MessagePattern('home.news.search')
  @MessagePattern({ cmd: 'home.search' })
  @MessagePattern('home.search')
  async handleHomeSearch(@Payload() data: { q: string }) {
    this.logger.log(`🔍 [AiController] Received home search request: ${data.q}`);
    try {
      const result = await this.homeService.search(data.q);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.news.list' })
  async handleListNews(@Payload() data: any) {
    try {
      const { payload } = data;
      const result = await this.homeService.listNews(
        payload.category || 'NEWS',
        payload.page != null ? Number(payload.page) : 0,
        payload.limit != null ? Number(payload.limit) : 10,
        payload.q || ''
      );
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.news.get' })
  async handleGetNewsArticle(@Payload() data: any) {
    try {
      const { payload } = data;
      const article = await this.homeService.getNewsArticle(payload.id);
      return { success: true, data: article };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.news.create' })
  async handleCreateNews(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      const article = await this.socialService.createNews(userId, payload);
      return { success: true, data: article };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.news.update' })
  async handleUpdateNews(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      const article = await this.socialService.updateNews(userId, payload);
      return { success: true, data: article };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.news.delete' })
  async handleDeleteNews(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      await this.socialService.deleteNews(userId, payload.id);
      return { success: true, message: 'Deleted' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
