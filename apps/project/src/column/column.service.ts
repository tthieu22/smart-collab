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
  async createColumn(params: { boardId: string; title?: string; type?: string; position?: number; projectId?: string; ownerId?: string }) {
    const { boardId, title, type, position, projectId, ownerId } = params;
    console.log(`[COLUMN] Create request from ${ownerId} →`, params);

    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new Error(`Board not found: ${boardId}`);

    const lastColumn = await this.prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
    });
    const newPosition = (lastColumn?.position ?? -1) + 1;

    const column = await this.prisma.column.create({
      data: {
        projectId: projectId || board.projectId!,
        boardId,
        title: title ?? `${type ?? 'Default'} column`,
        position: newPosition,
      },
    });

    await this.prisma.board.update({
      where: { id: boardId },
      data: { columnIds: [...(board.columnIds || []), column.id] },
    });

    const fullColumn = await this.getColumnById(column.id);

    // 👉 Chỉ publish 1 lần tại đây
    await this.amqpConnection.publish('project-exchange', 'column.created', {
      projectId: projectId || board.projectId,
      boardId,
      userId: ownerId,
      column: fullColumn,
    });

    console.log(`[COLUMN] Published event 'column.created' for ${column.id}`);
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

    await this.prisma.card.deleteMany({ where: { columnId } });
    await this.prisma.column.delete({ where: { id: columnId } });

    await this.amqpConnection.publish('project-exchange', 'column.deleted', { columnId });
    return { columnId };
  }

  async getColumnById(columnId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: {
        cards: { include: { labels: true, views: true } },
        views: true,
      },
    });
    return column;
  }

  async getColumnsByBoard(boardId: string) {
    return this.prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: { cards: { include: { labels: true, views: true } }, views: true },
    });
  }

  async getColumnsByProject(projectId: string) {
    return this.prisma.column.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
      include: { cards: { include: { labels: true, views: true } }, views: true },
    });
  }
}
