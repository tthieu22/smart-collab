import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ColumnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  /** Tạo column mới */
  async createColumn(params: { boardId: string; title: string }) {
    const board = await this.prisma.board.findUnique({ where: { id: params.boardId } });
    if (!board) throw new Error('Board not found');

    const column = await this.prisma.column.create({
      data: {
        boardId: params.boardId,
        projectId: board.projectId!,
        title: params.title,
      },
    });

    // Cập nhật columnIds của board
    await this.prisma.board.update({
      where: { id: params.boardId },
      data: { columnIds: [...board.columnIds, column.id] },
    });

    const fullColumn = await this.getColumnById(column.id);
    await this.amqpConnection.publish('project-exchange', 'column.created', { column: fullColumn });
    return fullColumn;
  }

  /** Cập nhật column */
  async updateColumn(params: { columnId: string; title?: string; position?: number }) {
    const column = await this.prisma.column.update({
      where: { id: params.columnId },
      data: {
        title: params.title,
        position: params.position,
      },
    });

    const fullColumn = await this.getColumnById(column.id);
    await this.amqpConnection.publish('project-exchange', 'column.updated', { column: fullColumn });
    return fullColumn;
  }

  /** Xóa column + xóa card liên quan */
  async removeColumn(columnId: string) {
    const column = await this.prisma.column.findUnique({ where: { id: columnId } });
    if (!column) throw new Error('Column not found');

    // Xóa cards liên quan
    await this.prisma.card.deleteMany({ where: { columnId } });
    await this.prisma.column.delete({ where: { id: columnId } });

    await this.amqpConnection.publish('project-exchange', 'column.deleted', { columnId });
    return { columnId };
  }

  /** Lấy column theo id + cards + views */
  async getColumnById(columnId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: {
        cards: {
          include: { labels: true, views: true },
        },
        views: true,
      },
    });
    if (!column) throw new Error('Column not found');
    return column;
  }

  /** Lấy tất cả column theo boardId */
  async getColumnsByBoard(boardId: string) {
    const columns = await this.prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: {
        cards: {
          include: { labels: true, views: true },
        },
        views: true,
      },
    });
    return columns;
  }

  /** Lấy tất cả column theo projectId */
  async getColumnsByProject(projectId: string) {
    const columns = await this.prisma.column.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
      include: {
        cards: {
          include: { labels: true, views: true },
        },
        views: true,
      },
    });
    return columns;
  }
}
