import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export type LlmProvider = 'openai' | 'claude';

export interface LlmResponse {
  content: string;       // text output đã clean
  raw?: any;             // raw response (optional – debug)
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly provider: LlmProvider;

  // ===== OpenAI client =====
  private openai?: OpenAI;

  constructor() {
    this.provider = (process.env.LLM_PROVIDER as LlmProvider) || 'openai';

    if (this.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    this.logger.log(`LLM provider: ${this.provider}`);
  }

  // ===============================
  // PUBLIC API
  // ===============================
  async complete(prompt: string): Promise<LlmResponse> {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string');
    }

    switch (this.provider) {
      case 'openai':
        return this.completeWithOpenAI(prompt);

      case 'claude':
        return this.completeWithClaude(prompt);

      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  // ===============================
  // OPENAI IMPLEMENTATION
  // ===============================
  private async completeWithOpenAI(prompt: string): Promise<LlmResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI that outputs ONLY valid JSON. No markdown. No explanation.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return {
        content,
        raw: response,
      };
    } catch (error: any) {
      this.logger.error('OpenAI completion failed', error?.stack || error);
      throw error;
    }
  }

  // ===============================
  // CLAUDE IMPLEMENTATION (STUB)
  // ===============================
  private async completeWithClaude(prompt: string): Promise<LlmResponse> {
    /**
     * Placeholder để sau thay bằng SDK Claude
     * (anthropic / bedrock / etc)
     */
    this.logger.warn('Claude provider not implemented yet');

    throw new Error('Claude provider not implemented');
  }
}
