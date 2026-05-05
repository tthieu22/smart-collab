import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { BoardModule } from './board/board.module';
import { ProjectService } from './project.service';
import { ColumnService } from './column/column.service';
import { CardService } from './card/card.service';
import { CardHandler } from './card/card.handle';
import { ProjectHandler } from './project.handle';
import { ColumnHandler } from './column/column.handler';
import { BoardHandler } from './board/board.handler';
import { ModelRegistryService } from './llm/model-registry.service';
import { LlmService } from './llm/llm.service';
import { ChatService } from './chat/chat.service';
import { ChatHandler } from './chat/chat.handle';
import { AutomationService } from './automation/automation.service';
import { AutomationHandler } from './automation/automation.handle';
import { MeetingService } from './meeting/meeting.service';
import { MeetingHandler } from './meeting/meeting.handle';

@Module({
  imports: [
    PrismaModule,
    BoardModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [
    CardHandler,
    ProjectHandler,
    ColumnHandler,
    BoardHandler,
    ChatHandler,
    AutomationHandler,
    MeetingHandler,
  ],
  providers: [
    ProjectService,
    ColumnService,
    CardService,
    LlmService,
    ModelRegistryService,
    ChatService,
    AutomationService,
    MeetingService,
  ],
  exports: [ProjectService, BoardModule],
})
export class ProjectModule {}
