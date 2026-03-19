import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AiService } from './ai.service';

import type {
  AnalyzeDomainInput,
  AnalyzeDomainOutput,
  BuildProjectInput,
  BuildProjectOutput,
} from './contracts';

@Controller()
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

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
}
