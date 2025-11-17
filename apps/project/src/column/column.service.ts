import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ColumnService {
  private readonly logger = new Logger(ColumnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  /** 🟢 Tạo column mới */
  async createColumn(params: {
    boardId: string;
    title?: string;
    type?: string;
    position?: number;
    projectId?: string;
    ownerId?: string;
  }) {
    const { boardId, title, type, position, projectId, ownerId } = params;
    this.logger.log(`[COLUMN] Create request from ${ownerId} →`, params);

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
        position: position ?? newPosition,
      },
    });

    await this.prisma.board.update({
      where: { id: boardId },
      data: { columnIds: [...(board.columnIds || []), column.id] },
    });

    const fullColumn = await this.getColumnById(column.id);
    this.logger.log(`[COLUMN] Created column ${column.id}`);

    return fullColumn;
  }

  /** 🟡 Cập nhật column */
  async updateColumn(params: { columnId: string; title?: string; position?: number }) {
    this.logger.log(`[COLUMN] Update request → ${JSON.stringify(params)}`);
    const column = await this.prisma.column.update({
      where: { id: params.columnId },
      data: {
        title: params.title,
        position: params.position,
      },
    });
    return this.getColumnById(column.id);
  }

  /** 🔴 Xóa column + card liên quan */
  async removeColumn(columnId: string) {
    this.logger.warn(`[COLUMN] Delete request → ${columnId}`);
    const column = await this.prisma.column.findUnique({ where: { id: columnId } });
    if (!column) throw new Error('Column not found');

    await this.prisma.card.deleteMany({ where: { columnId } });
    await this.prisma.column.delete({ where: { id: columnId } });

    this.logger.log(`[COLUMN] Deleted ${columnId}`);
    return { columnId };
  }
  /** 🟢 Di chuyển column sang vị trí khác hoặc board khác */
  async moveColumn(params: {
    columnId: string;
    sourceBoardId: string;
    targetBoardId: string;
    newPosition: number;
    projectId: string;
    movedById?: string;
  }) {
    const { columnId, sourceBoardId, targetBoardId, newPosition, projectId, movedById } = params;

    this.logger.log(`[COLUMN] Move request →`, params);

    const column = await this.prisma.column.findUnique({ where: { id: columnId } });
    if (!column) throw new Error(`Column not found: ${columnId}`);

    const sourceBoard = await this.prisma.board.findUnique({ where: { id: sourceBoardId } });
    const targetBoard = await this.prisma.board.findUnique({ where: { id: targetBoardId } });

    if (!targetBoard) throw new Error(`Target board not found: ${targetBoardId}`);

    // Xóa columnId khỏi danh sách sourceBoard.columnIds
    if (sourceBoard) {
      await this.prisma.board.update({
        where: { id: sourceBoardId },
        data: { columnIds: sourceBoard.columnIds.filter((id) => id !== columnId) },
      });
    }

    // Thêm columnId vào danh sách targetBoard.columnIds ở vị trí mới
    const updatedColumnIds = [...targetBoard.columnIds];
    updatedColumnIds.splice(newPosition, 0, columnId);

    await this.prisma.board.update({
      where: { id: targetBoardId },
      data: { columnIds: updatedColumnIds },
    });

    // Cập nhật thông tin column
    const updatedColumn = await this.prisma.column.update({
      where: { id: columnId },
      data: {
        boardId: targetBoardId,
        position: newPosition,
      },
    });

    const fullColumn = await this.getColumnById(updatedColumn.id);

    this.logger.log(`[COLUMN] Moved ${columnId} → board ${targetBoardId} at ${newPosition}`);

    const responseData = {
      srcBoardId: sourceBoardId,
      newBoardId: targetBoardId,
      columnId: updatedColumn.id,
      newPosition: updatedColumn.position,
      ...fullColumn,
    };

    // publish event realtime với dữ liệu chuẩn hóa
    await this.amqpConnection.publish('project-exchange', 'column.moved', {
      projectId,
      ...responseData,
      movedById,
      column: fullColumn,
    });

    return responseData;
  }

  /** 📦 Lấy column theo ID */
  async getColumnById(columnId: string) {
    return this.prisma.column.findUnique({
      where: { id: columnId },
      include: {
        cards: { include: { labels: true, views: true } },
        views: true,
      },
    });
  }

  /** 📋 Lấy tất cả columns theo board */
  async getColumnsByBoard(boardId: string) {
    return this.prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: {
        cards: { include: { labels: true, views: true } },
        views: true,
      },
    });
  }

  /** 📁 Lấy tất cả columns theo project */
  async getColumnsByProject(projectId: string) {
    return this.prisma.column.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
      include: {
        cards: { include: { labels: true, views: true } },
        views: true,
      },
    });
  }
}
