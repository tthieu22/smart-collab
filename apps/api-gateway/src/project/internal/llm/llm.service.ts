import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import axios from 'axios';

export interface LlmResponse {
  content: string;
  provider: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private groq!: Groq;
  private openrouterKey?: string;

  constructor(private readonly config: ConfigService) {
    this.init();
  }

  private init() {
    const groqKey = this.config.get<string>('GROQ_API_KEY');
    const openrouterKey = this.config.get<string>('OPENROUTER_API_KEY');

    if (groqKey) {
      this.groq = new Groq({
        apiKey: groqKey,
        timeout: 60000,
      });

      this.logger.log('✅ Groq initialized');
    }

    if (openrouterKey) {
      this.openrouterKey = openrouterKey;
      this.logger.log('✅ OpenRouter initialized');
    }
  }

  async complete(prompt: string): Promise<LlmResponse> {
    try {
      return await this.withRetry(() => this.completeGroq(prompt));
    } catch (err) {
      this.logger.warn('⚠️ Groq failed → fallback OpenRouter');

      try {
        return await this.completeOpenRouter(prompt);
      } catch (err) {
        this.logger.warn('⚠️ OpenRouter failed → fallback Ollama');

        return await this.completeOllama(prompt);
      }
    }
  }

  async completeText(prompt: string): Promise<LlmResponse> {
    try {
      return await this.withRetry(() => this.completeGroq(prompt, false));
    } catch (err) {
      this.logger.warn('⚠️ Groq text failed → fallback OpenRouter');
      try {
        return await this.completeOpenRouter(prompt, false);
      } catch (err) {
        this.logger.warn('⚠️ OpenRouter text failed → fallback Ollama');
        return await this.completeOllama(prompt, false);
      }
    }
  }

  async completeCustom(system: string, user: string): Promise<LlmResponse> {
    try {
      const res = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      return { 
        content: res.choices?.[0]?.message?.content?.trim() || '', 
        provider: 'groq' 
      };
    } catch (err) {
      this.logger.error('Groq custom chat failed', err);
      // Basic fallback
      return { content: 'Xin lỗi, tôi đang gặp sự cố. Bạn có thể hỏi lại sau không?', provider: 'error' };
    }
  }

  private async completeGroq(prompt: string, isJson = true): Promise<LlmResponse> {
    const res = await this.groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: isJson ? 0.3 : 0.7,
      messages: [
        {
          role: 'system',
          content: isJson ? `
          Return ONLY valid JSON.
          No explanation.
          No markdown.
          ` : 'Bạn là một trợ lý ảo hữu ích.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = res.choices?.[0]?.message?.content?.trim();

    if (!content) throw new Error('Empty Groq response');

    return {
      content: isJson ? this.cleanJson(content) : content,
      provider: 'groq',
    };
  }

  private async completeOpenRouter(prompt: string, isJson = true): Promise<LlmResponse> {
    if (!this.openrouterKey) {
      throw new Error('OpenRouter not configured');
    }

    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'user',
            content: isJson ? `${prompt}\n\nReturn ONLY valid JSON.` : prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${this.openrouterKey}`,
        },
      },
    );

    const content = res.data.choices?.[0]?.message?.content;

    if (!content) throw new Error('Empty OpenRouter response');

    return {
      content: isJson ? this.cleanJson(content) : content,
      provider: 'openrouter',
    };
  }

  private async completeOllama(prompt: string, isJson = true): Promise<LlmResponse> {
    const ollamaUrl = this.config.get<string>('microservices.ollama') || 'http://localhost:11434';
    const res = await axios.post(
      `${ollamaUrl}/api/generate`,
      {
        model: 'llama3',
        prompt: isJson ? `${prompt}\n\nReturn ONLY valid JSON.` : prompt,
        stream: false,
      },
    );

    if (!res.data.response) {
      throw new Error('Empty Ollama response');
    }

    return {
      content: isJson ? this.cleanJson(res.data.response) : res.data.response,
      provider: 'ollama',
    };
  }

  async getEmbeddings(text: string): Promise<number[]> {
    try {
      const ollamaUrl = this.config.get<string>('microservices.ollama') || 'http://localhost:11434';
      const res = await axios.post(`${ollamaUrl}/api/embeddings`, {
        model: 'mxbai-embed-large',
        prompt: text.substring(0, 512)
      });
      return res.data.embedding;
    } catch (err) {
      this.logger.warn('Embedding failed, returning empty vector');
      return [];
    }
  }

  private async withRetry(
    fn: () => Promise<LlmResponse>,
    retries = 3,
  ): Promise<LlmResponse> {
    try {
      return await fn();
    } catch (err: any) {
      const code = err?.code || err?.cause?.code;

      if (retries > 0 && code === 'ECONNRESET') {
        const wait = (4 - retries) * 2000;

        this.logger.warn(`🔁 Retry in ${wait}ms`);

        await new Promise((r) => setTimeout(r, wait));

        return this.withRetry(fn, retries - 1);
      }

      throw err;
    }
  }

  private cleanJson(text: string) {
    if (!text) return text;

    let cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');

    if (first !== -1 && last !== -1) {
      cleaned = cleaned.substring(first, last + 1);
    }

    return cleaned;
  }
}
