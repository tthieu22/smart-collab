import { Injectable, Logger } from '@nestjs/common';
import { ProjectPrismaService } from '../../prisma/prisma.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ColumnService {
  private readonly logger = new Logger(ColumnService.name);

  constructor(
    private readonly prisma: ProjectPrismaService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async getColumnById(columnId: string) {
    this.logger.log(`[getColumnById] columnId: ${columnId}`);
    return this.prisma.column.findUnique({
      where: { id: columnId, deletedAt: null },
      include: { cards: { where: { deletedAt: null }, orderBy: { position: 'asc' } } },
    });
  }

  async getColumnsByBoard(boardId: string) {
    this.logger.log(`[getColumnsByBoard] boardId: ${boardId}`);
    return this.prisma.column.findMany({
      where: { boardId, deletedAt: null },
      orderBy: { position: 'asc' },
      include: { cards: { where: { deletedAt: null }, orderBy: { position: 'asc' } } },
    });
  }

  async getColumnsByProject(projectId: string) {
    this.logger.log(`[getColumnsByProject] projectId: ${projectId}`);
    return this.prisma.column.findMany({
      where: { projectId, deletedAt: null },
      orderBy: [{ boardId: 'asc' }, { position: 'asc' }],
      include: { cards: { where: { deletedAt: null }, orderBy: { position: 'asc' } } },
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
      projectId: column.projectId,
      column: column,
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
    const column = await this.prisma.column.update({
      where: { id: columnId },
      data: { deletedAt: new Date() }
    });

    await this.amqpConnection.publish('project-exchange', 'column.deleted', { 
      columnId, 
      projectId: column.projectId,
      boardId: column.boardId 
    });

    // Notify recycle bin realtime
    this.amqpConnection.publish('smart-collab', 'realtime.recycle.added', {
      projectId: column.projectId,
      item: {
        id: column.id,
        title: column.title,
        type: 'column',
        deletedAt: new Date(),
      }
    });

    return column;
  }

  async restoreColumn(columnId: string) {
    const column = await this.prisma.column.update({
      where: { id: columnId },
      data: { deletedAt: null },
      include: { 
        cards: { 
          where: { deletedAt: null }, 
          orderBy: { position: 'asc' },
          include: {
            members: true,
            labels: true,
            checklist: true,
            attachments: true,
          }
        } 
      },
    });

    // Notify recycle bin realtime
    this.amqpConnection.publish('smart-collab', 'realtime.recycle.removed', {
      projectId: column.projectId,
      itemId: column.id,
    });

    // Notify project exchange for board updates
    this.amqpConnection.publish('project-exchange', 'column.created', {
      projectId: column.projectId,
      column: column,
    });

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
