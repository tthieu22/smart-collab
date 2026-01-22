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

  async analyze(prompt: string, locale = 'vi') {
    const aiPrompt = this.promptFactory.domain(prompt, locale);

    const response = await this.llm.complete(aiPrompt);

    return JSON.parse(response.content);
  }

}
