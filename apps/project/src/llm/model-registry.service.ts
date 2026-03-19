import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export type Provider = 'groq';

@Injectable()
export class ModelRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ModelRegistryService.name);

  private models: Record<Provider, string[]> = {
    groq: [],
  };

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    // await this.refresh();
  }

  async refresh() {
    await this.loadGroq();
    this.logger.log('✅ Model registry refreshed');
  }

  get(provider: Provider): string[] {
    return this.models[provider] || [];
  }

  getDefault(provider: Provider): string | undefined {
    const models = this.models[provider];

    if (!models?.length) return undefined;

    return (
      models.find((m) => m.includes('70b')) ||
      models.find((m) => m.includes('qwen')) ||
      models.find((m) => m.includes('instant')) ||
      models[0]
    );
  }

  private async loadGroq() {
    try {
      const key = this.config.get<string>('GROQ_API_KEY');
      if (!key) {
        this.logger.warn('⚠️ GROQ_API_KEY missing');
        return;
      }

      const groq = new Groq({
        apiKey: key,
        timeout: 60000,
        maxRetries: 2,
      });

      const res = await groq.models.list();

      const models = res.data
        .map((m) => m.id)
        .filter((id) => !id.includes('embed'));

      this.models.groq = models;

      this.logger.log(
        `🚀 Groq models loaded (${models.length}): ${models.join(', ')}`,
      );
    } catch (err) {
      this.logger.error('❌ Failed to load Groq models', err);
    }
  }
}