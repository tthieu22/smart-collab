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

  async getColumnById(columnId: string) {
    this.logger.log(`[getColumnById] columnId: ${columnId}`);
    return this.prisma.column.findUnique({
      where: { id: columnId },
      include: { cards: { orderBy: { position: 'asc' } } },
    });
  }

  async getColumnsByBoard(boardId: string) {
    this.logger.log(`[getColumnsByBoard] boardId: ${boardId}`);
    return this.prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: { cards: { orderBy: { position: 'asc' } } },
    });
  }

  async getColumnsByProject(projectId: string) {
    this.logger.log(`[getColumnsByProject] projectId: ${projectId}`);
    return this.prisma.column.findMany({
      where: { projectId },
      orderBy: [{ boardId: 'asc' }, { position: 'asc' }],
      include: { cards: { orderBy: { position: 'asc' } } },
    });
  }

  async createColumn(params: {
    projectId: string;
    boardId?: string;
    title: string;
    position?: number;
    correlationId?: string;
    ownerId?: string;
  }) {
    this.logger.log(`[createColumn] Creating column: ${params.title}`);
    
    let position = params.position;
    if (position === undefined) {
      const count = await this.prisma.column.count({
        where: { boardId: params.boardId, projectId: params.projectId },
      });
      position = count;
    }

    const column = await this.prisma.column.create({
      data: {
        projectId: params.projectId,
        boardId: params.boardId || null,
        title: params.title,
        position: position,
      },
    });

    await this.amqpConnection.publish('project-exchange', 'column.created', {
      ...column,
      correlationId: params.correlationId,
    });

    return column;
  }

  async updateColumn(params: {
    columnId: string;
    title?: string;
    position?: number;
  }) {
    this.logger.log(`[updateColumn] columnId: ${params.columnId}`);
    const column = await this.prisma.column.update({
      where: { id: params.columnId },
      data: {
        title: params.title,
        position: params.position,
      },
    });

    await this.amqpConnection.publish('project-exchange', 'column.updated', column);
    return column;
  }

  async removeColumn(columnId: string) {
    this.logger.log(`[removeColumn] columnId: ${columnId}`);
    const column = await this.prisma.column.delete({
      where: { id: columnId },
    });

    await this.amqpConnection.publish('project-exchange', 'column.deleted', { columnId });
    return column;
  }

  async moveColumn(params: {
    projectId: string;
    columnId: string;
    sourceBoardId?: string;
    targetBoardId?: string;
    newPosition: number;
    movedById: string;
  }) {
    const { columnId, targetBoardId, newPosition, projectId } = params;
    this.logger.log(`[moveColumn] columnId: ${columnId} to position: ${newPosition}`);

    const result = await this.prisma.$transaction(async (tx) => {
        const column = await tx.column.findUnique({ where: { id: columnId } });
        if (!column) throw new Error('Column not found');

        const oldBoardId = column.boardId;
        const oldPosition = column.position;
        const isSameBoard = oldBoardId === targetBoardId;

        if (isSameBoard) {
            if (oldPosition !== newPosition) {
                const adjustment = oldPosition < newPosition ? -1 : 1;
                await tx.column.updateMany({
                    where: {
                        boardId: targetBoardId,
                        projectId: projectId,
                        position: {
                            gte: Math.min(oldPosition, newPosition),
                            lte: Math.max(oldPosition, newPosition),
                        },
                        id: { not: columnId },
                    },
                    data: { position: { increment: adjustment } },
                });
            }
        } else {
            // Remove from old board
            if (oldBoardId) {
                await tx.column.updateMany({
                    where: { boardId: oldBoardId, position: { gt: oldPosition } },
                    data: { position: { decrement: 1 } },
                });
            }
            // Add to new board
            await tx.column.updateMany({
                where: { boardId: targetBoardId, position: { gte: newPosition } },
                data: { position: { increment: 1 } },
            });
        }

        return tx.column.update({
            where: { id: columnId },
            data: { boardId: targetBoardId || null, position: newPosition },
        });
    });

    await this.amqpConnection.publish('project-exchange', 'column.moved', result);
    return result;
  }
}
