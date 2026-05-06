import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { HomeModule } from '../home/home.module';
import { ProjectModule } from '../project/project.module';
import { AuthModule } from '../auth/auth.module';

// Internal implementations
import { AiHandler } from './internal/ai.handler';
import { InternalAiService } from './internal/ai.service';
import { DomainService } from './internal/domain.service';
import { EventsPublisher } from './internal/events.publisher';
import { PromptFactory } from './internal/prompt.factory';
import { ScraperService } from './internal/scraper.service';
import { DiscoveryService } from './internal/discovery.service';
import { ImageService } from './internal/image.service';
import { LlmService } from '../project/internal/llm/llm.service';
import { ModelRegistryService } from '../project/internal/llm/model-registry.service';

import {
  ProjectGenerator,
  BoardGenerator,
  ColumnGenerator,
  CardGenerator,
  CardDetailGenerator,
  CardViewGenerator,
} from './internal/generators';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    forwardRef(() => HomeModule),
    forwardRef(() => ProjectModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AiHandler,
    InternalAiService,
    DomainService,
    EventsPublisher,
    PromptFactory,
    ScraperService,
    DiscoveryService,
    ImageService,
    LlmService,
    ModelRegistryService,
    ProjectGenerator,
    BoardGenerator,
    ColumnGenerator,
    CardGenerator,
    CardDetailGenerator,
    CardViewGenerator,
  ],
  exports: [AiService],
})
export class AiModule {}
