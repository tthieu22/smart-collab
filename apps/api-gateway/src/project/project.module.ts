import { Module, Global } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ColumnController } from './column/column.controller';
import { CardController } from './column/card.controller';
import { ProjectService } from './project.service';

// Internal implementations
import { ProjectService as InternalProjectService } from './internal/project.service';
import { ProjectHandler } from './internal/project.handle';

import { BoardService as InternalBoardService } from './internal/board/board.service';
import { BoardHandler } from './internal/board/board.handler';

import { ColumnService as InternalColumnService } from './internal/column/column.service';
import { ColumnHandler } from './internal/column/column.handler';

import { CardService as InternalCardService } from './internal/card/card.service';
import { CardHandler } from './internal/card/card.handle';

import { ChatService as InternalChatService } from './internal/chat/chat.service';
import { ChatHandler } from './internal/chat/chat.handle';
import { MeetingService as InternalMeetingService } from './internal/meeting/meeting.service';
import { MeetingHandler } from './internal/meeting/meeting.handle';
import { AutomationService as InternalAutomationService } from './internal/automation/automation.service';
import { AutomationHandler } from './internal/automation/automation.handle';

@Global()
@Module({
  controllers: [ProjectController, ColumnController, CardController],
  providers: [
    ProjectService,
    // Internal implementations
    InternalProjectService,
    InternalBoardService,
    InternalColumnService,
    InternalCardService,
    InternalChatService,
    ProjectHandler,
    BoardHandler,
    ColumnHandler,
    CardHandler,
    ChatHandler,
    MeetingHandler,
    AutomationHandler,
    InternalMeetingService,
    InternalAutomationService,
  ],
  exports: [ProjectService, InternalProjectService],
})
export class ProjectModule {}
