import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProjectConsumer } from './project.consumer';
import { PrismaModule } from '../prisma/project.module';
// import { ProjectMemberConsumer } from './project.member.consumer';
import { BoardModule } from './board/board.module';
import { SharedRabbitMQModule } from './config/rabbitmq.module';
import { ProjectService } from './project.service';
import { ColumnConsumer } from './column/column.consumer';
import { ColumnService } from './column/column.service';
// import { CardConsumer } from './card/card.consumer';
import { CardService } from './card/card.service';
import { CardHandler } from './card/card.handle';
import { ProjectHandler } from './project.handle';
import { ColumnHandler } from './column/column.handler';
import { BoardConsumer } from './board/board.consumer';
import { BoardHandler } from './board/board.handler';
import { ModelRegistryService } from './llm/model-registry.service';
import { LlmService } from './llm/llm.service';
import { AiModule } from './ai/ai.module';
import { ChatService } from './chat/chat.service';
import { ChatHandler } from './chat/chat.handle';
import { AutomationService } from './automation/automation.service';
import { AutomationConsumer } from './automation/automation.consumer';
import { AutomationHandler } from './automation/automation.handle';

@Module({
  imports: [
    PrismaModule,
    BoardModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SharedRabbitMQModule,
    AiModule,
  ],
  controllers: [CardHandler, ProjectHandler, ColumnHandler, BoardHandler, ChatHandler, AutomationHandler],

  providers: [
    ProjectConsumer,
    ProjectService,
    ColumnService,
    ColumnConsumer,
    // CardConsumer,
    CardService,
    LlmService,
    ModelRegistryService,
    ChatService,
    AutomationService,
    AutomationConsumer
  ],
})
export class ProjectModule {}