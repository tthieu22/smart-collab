import { Injectable, Logger } from '@nestjs/common';
import { PromptFactory } from './prompt.factory';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class DomainService {
  private readonly logger = new Logger(DomainService.name);

  constructor(
    private readonly promptFactory: PromptFactory,
    private readonly llm: LlmService,
  ) {}

  async analyze(userPrompt: string, locale = 'vi') {
    this.logger.log('🔍 Analyze domain');

    // ✅ đúng method name
    const aiPrompt = this.promptFactory.analyzeDomain(
      userPrompt,
      locale,
    );

    const response = await this.llm.complete(aiPrompt);

    // ✅ parse an toàn (ít nhất là strip JSON)
    const json = this.safeJsonParse(response.content);

    return json;
  }

  // ================= PRIVATE =================
  private safeJsonParse(text: string) {
    try {
      // lấy từ { đầu tiên đến } cuối cùng
      const jsonText = text
        .slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
        .trim();

      return JSON.parse(jsonText);
    } catch (err) {
      this.logger.error('❌ Domain JSON parse failed', text);
      throw new Error('INVALID_DOMAIN_JSON');
    }
  }
}
