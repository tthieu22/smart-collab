import { Injectable, Logger } from '@nestjs/common';
import { ProjectHandler } from './internal/project.handle';
import { BoardHandler } from './internal/board/board.handler';
import { ColumnHandler } from './internal/column/column.handler';
import { CardHandler } from './internal/card/card.handle';
import { ChatHandler } from './internal/chat/chat.handle';
import { MeetingHandler } from './internal/meeting/meeting.handle';
import { AutomationHandler } from './internal/automation/automation.handle';

@Injectable()
export class ProjectService {
  constructor(
    public readonly project: ProjectHandler,
    public readonly board: BoardHandler,
    public readonly column: ColumnHandler,
    public readonly card: CardHandler,
    public readonly chat: ChatHandler,
    public readonly meeting: MeetingHandler,
    public readonly automation: AutomationHandler,
  ) {}

  // Helper to simulate ClientProxy.send
  async send(pattern: { cmd: string }, payload: any) {
    const { cmd } = pattern;
    
    // Default project commands
    switch (cmd) {
      case 'project.create': return this.project.handleCreateProject(payload);
      case 'project.update': return this.project.handleUpdateProject(payload);
      case 'project.delete': return this.project.handleDeleteProject(payload);
      case 'project.get': return this.project.handleGetProject(payload);
      case 'project.get_all': return this.project.handleGetAllProjects(payload);
      case 'project.add_member': return this.project.handleAddMember(payload);
      case 'project.remove_member': return this.project.handleRemoveMember(payload);
      case 'project.member.respond_invite': return this.project.handleRespondInvite(payload);
      case 'project.analytics': return this.project.handleGetAnalytics(payload);
      case 'project.search': return this.project.handleSearch(payload);
      case 'project.get_top_collaborators': return this.project.handleGetTopCollaborators();
      case 'project.recycle-bin.get_all': return this.project.handleGetRecycleBin(payload);
      case 'project.restore': return this.project.handleRestoreProject(payload);
      
      // Board commands
      case 'board.create':
      case 'project.board.create': return this.board.handleCreateBoard(payload);
      case 'board.get':
      case 'project.board.get': return this.board.handleGetBoards(payload);
      case 'board.update':
      case 'project.board.update': return this.board.handleUpdateBoard(payload);
      case 'board.delete':
      case 'project.board.delete': return this.board.handleDeleteBoard(payload);
      case 'board.restore':
      case 'project.board.restore': return this.board.handleRestoreBoard(payload);
      
      // Column commands
      case 'project.column.create': return this.column.handleCreateColumn(payload);
      case 'project.column.update': return this.column.handleUpdateColumn(payload);
      case 'project.column.move': return this.column.handleMoveColumn(payload);
      case 'project.column.delete': return this.column.handleDeleteColumn(payload);
      case 'project.column.restore': return this.column.handleRestoreColumn(payload);
      case 'project.get.column': return this.column.handleGetColumn(payload);
      case 'project.get.columnsByBoard': return this.column.handleGetColumnsByBoard(payload);
      case 'project.get.columnsByProject': return this.column.handleGetColumnsByProject(payload);
      
      // Card commands
      case 'project.card.create': return this.card.handleCreateCard(payload);
      case 'project.card.update': return this.card.handleUpdateCard(payload);
      case 'project.card.move': return this.card.handleMoveCard(payload);
      case 'project.card.delete': return this.card.handleDeleteCard(payload);
      case 'project.card.copy': return this.card.handleCopyCard(payload);
      case 'project.card.restore': return this.card.handleRestoreCard(payload);
      case 'project.get.card': return this.card.handleGetDetail(payload);
      case 'project.get.cardsByColumn': return this.card.handleGetCardsByColumn(payload);
      case 'project.get.cardsByProject': return this.card.handleGetCardsByProject(payload);
      case 'project.custom-field.create': return this.card.handleCreateCustomField(payload);
      case 'project.custom-field.get_all': return this.card.handleGetCustomFields(payload);
      case 'project.custom-field.delete': return this.card.handleDeleteCustomField(payload);
      
      // Chat
      case 'project.chat.get_all': return this.chat.handleGetMessages(payload);
      case 'project.chat.send': return this.chat.handleSendMessage(payload);

      // Meeting
      case 'project.meeting.create': return this.meeting.handleCreateMeeting(payload);
      case 'project.meeting.get_all': return this.meeting.handleGetMeetings(payload);

      // Automation
      case 'project.automation.get_all': return this.automation.handleGetRules(payload);
      case 'project.automation.create': return this.automation.handleCreateRule(payload);
      case 'project.automation.delete': return this.automation.handleDeleteAutomation(payload);

      default:
        throw new Error(`Unhandled project command: ${cmd}`);
    }
  }
}
