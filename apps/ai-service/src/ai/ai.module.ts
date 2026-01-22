import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DomainService } from './domain.service';
import { PromptFactory } from './prompt.factory';
import { EventsPublisher } from './events.publisher';

import {
  ProjectGenerator,
  BoardGenerator,
  ColumnGenerator,
  CardGenerator,
  CardViewGenerator,
  CardDetailGenerator,
} from './generators';
import { SharedRabbitMQModule } from 'src/config/rabbitmq.module';
import { ClientsModule } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getNestRabbitMQOptions } from 'src/config/rabbitmq.config';
import { LlmService } from 'src/llm/llm.service';

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
    CardDetailGenerator
  ],
})
export class AiModule {}
