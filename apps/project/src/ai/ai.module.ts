import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DomainService } from './domain.service';
import { PromptFactory } from './prompt.factory';
import { EventsPublisher } from './events.publisher';
import { ScraperService } from './scraper.service';
import { DiscoveryService } from './discovery.service';
import { ImageService } from './image.service';

import {
  ProjectGenerator,
  BoardGenerator,
  ColumnGenerator,
  CardGenerator,
  CardViewGenerator,
  CardDetailGenerator,
} from './generators';
import { ClientsModule } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SharedRabbitMQModule } from '../config/rabbitmq.module';
import { getNestRabbitMQOptions } from '../config/rabbitmq.config';
import { LlmService } from '../llm/llm.service';
import { ModelRegistryService } from '../llm/model-registry.service';

@Module({
  imports: [
    SharedRabbitMQModule,
    ClientsModule.registerAsync([
      {
        name: 'PROJECT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getNestRabbitMQOptions('project_queue', configService),
      },
      {
        name: 'HOME_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getNestRabbitMQOptions('home_requests_queue', configService),
      },
    ]),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    LlmService,
    DomainService,
    PromptFactory,
    EventsPublisher,
    ProjectGenerator,
    BoardGenerator,
    ColumnGenerator,
    CardGenerator,
    CardViewGenerator,
    CardDetailGenerator,
    ModelRegistryService,
    ScraperService,
    DiscoveryService,
    ImageService
  ],
})
export class AiModule {}
