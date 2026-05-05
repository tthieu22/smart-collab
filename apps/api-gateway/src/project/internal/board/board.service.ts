import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private getDefaultTitle(type: string) {
    switch (type) {
      case 'inbox': return 'Inbox';
      case 'calendar': return 'Calendar';
      case 'board':
      default: return 'Board';
    }
  }

  /** 🧩 Tạo board mặc định */
  async createBoard(params: {
    projectId?: string;
    ownerId?: string;
    type: 'board' | 'inbox' | 'calendar';
    title?: string;
  }) {
    const { projectId, ownerId, type, title } = params;

    const existing = await this.prisma.board.findFirst({
      where: type === 'board' ? { projectId, type } : { ownerId, type },
    });

    if (existing) {
      throw new Error(`${type} board already exists`);
    }

    const boardProjectId =
      type === 'inbox' || type === 'calendar' ? undefined : projectId;

    const board = await this.prisma.board.create({
      data: {
        projectId: boardProjectId,
        ownerId: ownerId || null,
        type,
        title: title || this.getDefaultTitle(type),
        position: 0,
        columnIds: [], // vẫn để rỗng
      },
    });

    // Personal boards must always have a working column for drag-drop/calendar.
    if (type === 'inbox' || type === 'calendar') {
      await this.prisma.column.create({
        data: {
          boardId: board.id,
          projectId: null,
          title: type === 'inbox' ? 'Inbox' : 'Schedule',
          position: 0,
        },
      });
    }

    const fullBoard = await this.getBoardById(board.id);

    this.eventEmitter.emit(
      'board.created',
      { board: fullBoard },
    );

    return fullBoard;
  }

  /** Lấy full board (columns + cards + labels + views) */
  async getBoardById(boardId: string) {
    const board = await this.prisma.board.findUnique({ 
      where: { id: boardId, deletedAt: null } 
    });
    if (!board) return null;

    const columns = await this.prisma.column.findMany({
      where: { boardId: board.id, deletedAt: null },
      orderBy: { position: 'asc' },
    });

    const columnIds = columns.map((c: any) => c.id);
    const cards = await this.prisma.card.findMany({
      where: { columnId: { in: columnIds }, deletedAt: null },
      orderBy: { position: 'asc' },
    });

    const cardIds = cards.map((c: any) => c.id);
    const [labels, views] = await Promise.all([
      this.prisma.cardLabel.findMany({ where: { cardId: { in: cardIds } } }),
      this.prisma.cardView.findMany({ where: { cardId: { in: cardIds } } }),
    ]);

    const members = board.projectId
      ? await this.prisma.projectMember.findMany({ where: { projectId: board.projectId } })
      : [];

    // Chuẩn hóa cấu trúc cho drag-drop
    const fullColumns = columns.map((col: any) => ({
      ...col,
      cards: cards
        .filter((c: any) => c.columnId === col.id)
        .map((c: any) => ({
          ...c,
          labels: labels.filter((l: any) => l.cardId === c.id),
          views: views.filter((v: any) => v.cardId === c.id),
        })),
    }));

    return { ...board, columns: fullColumns, members };
  }

  /** Lấy danh sách boards theo project/owner */
  async getBoards(params: {
    projectId?: string;
    ownerId?: string;
    type: 'board' | 'inbox' | 'calendar';
  }) {
    const { projectId, ownerId, type } = params;

    if ((type === 'inbox' || type === 'calendar') && ownerId) {
      const personalBoard = await this.prisma.board.findFirst({
        where: { ownerId, type, projectId: null },
      });

      if (!personalBoard) {
        await this.createBoard({ ownerId, type });
      }
    }

    const where =
      type === 'board'
        ? { projectId, type }
        : { ownerId, type };

    const boards = await this.prisma.board.findMany({
      where: { ...where, deletedAt: null },
      orderBy: { position: 'asc' },
    });

    const results = await Promise.all(boards.map((b: any) => this.getBoardById(b.id)));
    return results;
  }

  /** ✏️ Cập nhật board */
  async updateBoard(
    boardId: string,
    data: Partial<{ title: string; metadata: any; position: number }>,
  ) {
    const board = await this.prisma.board.update({ where: { id: boardId }, data });
    const fullBoard = await this.getBoardById(board.id);
    this.eventEmitter.emit('board.updated', { board: fullBoard });
    return fullBoard;
  }

  /** ❌ Xóa board */
  async deleteBoard(boardId: string) {
    const board = await this.prisma.board.update({ 
      where: { id: boardId },
      data: { deletedAt: new Date() }
    });
    this.eventEmitter.emit('board.deleted', { boardId, projectId: board.projectId });

    if (board.projectId) {
      // Notify recycle bin realtime
      this.eventEmitter.emit('realtime.recycle.added', {
        projectId: board.projectId,
        item: {
          id: board.id,
          title: board.title,
          type: 'board',
          deletedAt: new Date(),
        }
      });
    }

    return { boardId };
  }

  async restoreBoard(boardId: string) {
    const board = await this.prisma.board.update({ 
      where: { id: boardId },
      data: { deletedAt: null }
    });

    if (board.projectId) {
      // Notify recycle bin realtime
      this.eventEmitter.emit('realtime.recycle.removed', {
        projectId: board.projectId,
        itemId: board.id,
      });

      // Notify project exchange for UI updates
      this.eventEmitter.emit('board.created', {
        projectId: board.projectId,
        board: board,
      });
    }

    return board;
  }
}
