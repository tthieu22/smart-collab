import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AuthPrismaService } from '../../../../prisma/prisma.service';
import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AutoPostService implements OnModuleInit {
  private readonly logger = new Logger(AutoPostService.name);
  private readonly DEFAULT_TEMPLATE = 'Tao bai viet tin tuc ngan gon ve du an: {{topic}}';
  private readonly MAX_POSTS_PER_RUN = 10;
  private readonly MIN_INTERVAL_MINUTES = 1;
  private readonly DEFAULT_INTERVAL_MINUTES = 60;

  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  onModuleInit() {
    // Note: Timeout handling is usually done in the RabbitMQ module config
  }

  async getSettings() {
    return this.loadOrCreateSettings();
  }

  async updateSettings(payload: any) {
    const settings = await this.loadOrCreateSettings();
    
    const updateData: any = {};
    if (payload.enabled !== undefined) updateData.enabled = !!payload.enabled;
    if (payload.eventTriggerEnabled !== undefined) updateData.eventTriggerEnabled = !!payload.eventTriggerEnabled;
    if (payload.contentTemplate !== undefined) updateData.contentTemplate = payload.contentTemplate || this.DEFAULT_TEMPLATE;
    if (payload.locale !== undefined) updateData.locale = payload.locale;
    if (payload.postCountPerRun !== undefined) updateData.postCountPerRun = Math.max(1, Math.min(payload.postCountPerRun, this.MAX_POSTS_PER_RUN));
    if (payload.intervalMinutes !== undefined) updateData.intervalMinutes = Math.max(this.MIN_INTERVAL_MINUTES, payload.intervalMinutes);
    if (payload.rssSources !== undefined) updateData.rssSources = payload.rssSources;
    if (payload.topicTrackingDays !== undefined) updateData.topicTrackingDays = Math.max(1, Math.min(payload.topicTrackingDays, 30));

    return this.prisma.autoPostSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async scheduledAutoPost() {
    const settings = await this.loadOrCreateSettings();
    if (!settings.enabled) return;

    const lastRun = settings.lastRunAt;
    const interval = Math.max(settings.intervalMinutes, this.MIN_INTERVAL_MINUTES);
    
    if (lastRun && new Date(lastRun.getTime() + interval * 60000) > new Date()) {
      return;
    }

    await this.runAutoPost('AUTO_AI_SCHEDULE', null, null, true);
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'ai.project.built',
    queue: 'home-service.ai-project-built',
  })
  async onAiProjectBuilt(msg: { projectId: string }) {
    const settings = await this.loadOrCreateSettings();
    if (!settings.enabled || !settings.eventTriggerEnabled) {
      return;
    }

    const projectId = msg.projectId;
    if (!projectId) return;

    const dedupKey = `ai.project.built:${projectId}`;
    // Check if we already posted about this project
    const exists = await this.prisma.newsArticle.findFirst({ where: { sourceUrl: dedupKey } });
    if (exists) return;

    await this.runAutoPost('AUTO_AI_EVENT', `project ${projectId}`, dedupKey, true);
  }

  async runAutoPost(source: string, topic: string | null, eventKey: string | null, enforceEnabled: boolean) {
    const settings = await this.loadOrCreateSettings();
    if (enforceEnabled && !settings.enabled) {
      return { success: false, message: 'auto post is disabled' };
    }

    const admin = await this.resolveAdminUser();
    if (!admin) return { success: false, message: 'admin user not found' };

    this.logger.log(`[AutoPost] Starting production pipeline via ${source}`);

    // 1. DISCOVERY
    const candidates = await this.discoverCandidates(settings, topic);
    if (candidates.length === 0) {
      return { success: false, message: 'No content discovered' };
    }

    let saved = 0;
    const maxToPost = settings.postCountPerRun;

    for (const candidate of candidates) {
      if (saved >= maxToPost) break;

      const candidateUrl = candidate.link;
      const candidateTitle = candidate.title;

      // 2. DEDUPLICATION LAYER 1: URL
      if (candidateUrl) {
        const exists = await this.prisma.newsArticle.findFirst({ where: { sourceUrl: candidateUrl } });
        if (exists) continue;
      }

      // 3. REWRITE & ENRICH (via AI)
      const generated = await this.generateContentWithAi(settings, candidateTitle, candidate.content, source);
      if (!generated) continue;

      // 4. DEDUPLICATION LAYER 2: HASH
      const contentHash = crypto.createHash('sha256').update(generated.title + generated.content).digest('hex');
      const hashExists = await this.prisma.newsArticle.findFirst({ where: { hash: contentHash } });
      if (hashExists) continue;

      // 5. DEDUPLICATION LAYER 3: SEMANTIC SIMILARITY
      const embedding = await this.getEmbeddingWithAi(generated.title);
      if (await this.isSemanticallyDuplicate(embedding)) {
        this.logger.log(`[AutoPost] Skipping (Semantic duplicate): ${generated.title}`);
        continue;
      }

      // 6. IMAGE DISCOVERY
      const imageUrl = await this.resolveImageUrl(generated, generated.title);

      // 7. SAVE POST
      await this.prisma.newsArticle.create({
        data: {
          authorId: admin.id,
          category: 'NEWS',
          title: generated.title,
          content: generated.content,
          sourceUrl: candidateUrl,
          hash: contentHash,
          embedding: embedding,
          linkUrl: generated.linkUrl || candidateUrl,
          media: [{ type: 'image', url: imageUrl }] as any,
        },
      });
      saved++;
    }

    if (saved > 0 && source !== 'MANUAL_ADMIN') {
      await this.prisma.autoPostSettings.update({
        where: { id: settings.id },
        data: { lastRunAt: new Date() },
      });
    }

    return { success: true, savedCount: saved };
  }

  private async discoverCandidates(settings: any, manualTopic: string | null): Promise<any[]> {
    const packet = {
      sources: settings.rssSources || ['https://vnexpress.net/rss/so-hoa.rss'],
      strategy: manualTopic ? 'MANUAL' : 'MIXED',
      topic: manualTopic,
    };

    const response = await this.amqpConnection.request<any>({
      exchange: '',
      routingKey: 'ai_queue',
      payload: {
        id: uuidv4(),
        pattern: { cmd: 'ai.discover-content' },
        data: packet,
      },
    });

    if (response && response.response && response.response.items) {
      return response.response.items;
    }
    return [];
  }

  private async generateContentWithAi(settings: any, title: string, originalContent: string, source: string): Promise<any> {
    const data = {
      template: settings.contentTemplate,
      locale: settings.locale,
      context: {
        topic: title,
        original: originalContent,
        source: source,
        angle: this.decideAngle(),
      },
    };

    const response = await this.amqpConnection.request<any>({
      exchange: '',
      routingKey: 'ai_queue',
      payload: {
        id: uuidv4(),
        pattern: { cmd: 'ai.generate-news-post' },
        data: data,
      },
    });

    return this.extractNewsBodyFromAiReply(response);
  }

  private async getEmbeddingWithAi(text: string): Promise<number[]> {
    const response = await this.amqpConnection.request<any>({
      exchange: '',
      routingKey: 'ai_queue',
      payload: {
        id: uuidv4(),
        pattern: { cmd: 'ai.get-embeddings' },
        data: { text },
      },
    });

    if (response && response.response && response.response.vector) {
      return response.response.vector;
    }
    return [];
  }

  private async isSemanticallyDuplicate(newVec: number[]): Promise<boolean> {
    if (!newVec || newVec.length === 0) return false;

    const recent = await this.prisma.newsArticle.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      where: { embedding: { isEmpty: false } } as any,
    });

    for (const article of recent) {
      const sim = this.cosineSimilarity(newVec, article.embedding);
      if (sim > 0.85) return true;
    }
    return false;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async resolveImageUrl(aiData: any, title: string): Promise<string> {
    if (aiData.imageUrl && aiData.imageUrl.startsWith('http')) return aiData.imageUrl;

    const keywords = aiData.imageKeywords || title;
    const response = await this.amqpConnection.request<any>({
      exchange: '',
      routingKey: 'ai_queue',
      payload: {
        id: uuidv4(),
        pattern: { cmd: 'ai.search-images' },
        data: { query: keywords },
      },
    });

    if (response && response.response && response.response.urls && response.response.urls.length > 0) {
      return response.response.urls[0];
    }

    return `https://loremflickr.com/1200/800/${keywords.replace(/[^a-zA-Z0-9]+/g, ',')}`;
  }

  private decideAngle(): string {
    const angles = ['hướng dẫn cho người mới', 'phân tích chuyên sâu', 'so sánh', 'case study', 'xu hướng 2026'];
    return angles[Math.floor(Math.random() * angles.length)];
  }

  private extractNewsBodyFromAiReply(response: any): any {
    const payload = response?.response || response;
    if (!payload || payload.success === false) return null;

    if (!payload.content || payload.content.length < 100) return null;

    return {
      title: payload.title || 'Tin tức mới',
      content: payload.content,
      imageUrl: payload.imageUrl,
      linkUrl: payload.linkUrl,
      imageKeywords: payload.imageKeywords,
    };
  }

  private async loadOrCreateSettings() {
    const existing = await this.prisma.autoPostSettings.findFirst();
    if (existing) return existing;

    return this.prisma.autoPostSettings.create({
      data: {
        enabled: false,
        eventTriggerEnabled: true,
        postCountPerRun: 1,
        intervalMinutes: this.DEFAULT_INTERVAL_MINUTES,
        contentTemplate: this.DEFAULT_TEMPLATE,
        locale: 'vi',
        rssSources: [
          'https://vnexpress.net/rss/so-hoa.rss',
          'https://techcrunch.com/feed/',
          'https://thanhnien.vn/rss/cong-nghe-game-12.rss',
        ],
        topicTrackingDays: 7,
      },
    });
  }

  private async resolveAdminUser() {
    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) return admin;
    return this.prisma.user.findFirst();
  }
}
