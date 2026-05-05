import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AutoPostService implements OnModuleInit {
  private readonly logger = new Logger(AutoPostService.name);
  private readonly DEFAULT_TEMPLATE = 'Tao bai viet tin tuc ngan gon ve du an: {{topic}}';
  private readonly MAX_POSTS_PER_RUN = 10;
  private readonly MIN_INTERVAL_MINUTES = 1;
  private readonly DEFAULT_INTERVAL_MINUTES = 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.logger.log('AutoPostService initialized');
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

  @OnEvent('ai.project.built')
  async onAiProjectBuilt(msg: { projectId: string }) {
    const settings = await this.loadOrCreateSettings();
    if (!settings.enabled || !settings.eventTriggerEnabled) {
      return;
    }

    const projectId = msg.projectId;
    if (!projectId) return;

    const dedupKey = `ai.project.built:${projectId}`;
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

    // TODO: Implement discovery and generation locally instead of RabbitMQ request
    this.logger.warn('[AutoPost] Content discovery and generation via local services needs implementation');
    
    return { success: false, message: 'Implementation pending local AI services' };
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
