import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  /** Lấy card theo id, include labels, views, column */
  async getCardById(cardId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        labels: true,
        views: true,
        column: true,
      },
    });
    if (!card) return [];
    return card;
  }

  /** Lấy tất cả card của 1 column */
  async getCardsByColumn(columnId: string) {
    return this.prisma.card.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
      include: {
        labels: true,
        views: true,
        column: true,
      },
    });
  }

  async getCardDetail(cardId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        labels: true,
        views: true,
      },
    });
    if (!card) return [];
    return card;
  }

    
  /** Tạo card mới */
  async createCard(params: {
    projectId: string,
    columnId: string,
    title: string,
    description?: string,
    status?: string,
    deadline?: Date,
    priority?: number,
    createdById?: string,
  }) {
    const column = await this.prisma.column.findUnique({ where: { id: params.columnId } });
    if (!column) throw new Error('Column not found');

    const card = await this.prisma.card.create({
      data: {
        columnId: params.columnId,
        projectId: column.projectId,
        title: params.title,
        description: params.description || null,
        status: params.status || 'ACTIVE',
        deadline: params.deadline || null,
        priority: params.priority || null,
        createdById: params.createdById || null,
      },
      include: {
        labels: true,
        views: true,
      },
    });

    const cardToReturn = {
      id: card.id,
      columnId: card.columnId,
      title: card.title,
      description: card.description || '',
      position: card.position,
      labels: card.labels || [],
      views: card.views || [],
    };

    await this.amqpConnection.publish('project-exchange', 'card.created', { card: cardToReturn });

    return cardToReturn;
  }

  /** Cập nhật card */
  async updateCard(params: {
    cardId: string;
    title?: string;
    description?: string;
    status?: string;
    deadline?: Date;
    priority?: number;
    updatedById?: string;
  }) {
    const card = await this.prisma.card.update({
      where: { id: params.cardId },
      data: {
        title: params.title,
        description: params.description,
        status: params.status,
        deadline: params.deadline,
        priority: params.priority,
        updatedById: params.updatedById,
      },
      include: { labels: true, views: true, column: true },
    });

    await this.amqpConnection.publish('project-exchange', 'card.updated', { card });
    return card;
  }

  /** Xóa card */
  async removeCard(cardId: string) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new Error('Card not found');

    await this.prisma.card.delete({ where: { id: cardId } });

    // Gửi realtime
    await this.amqpConnection.publish('project-exchange', 'card.deleted', { cardId });
    return { cardId };
  }

  /** Di chuyển card giữa các column */
  async moveCard(cardId: string, destColumnId: string, destIndex: number) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new Error('Card not found');

    const destColumn = await this.prisma.column.findUnique({ where: { id: destColumnId } });
    if (!destColumn) throw new Error('Destination column not found');

    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        columnId: destColumnId,
        position: destIndex,
      },
      include: { labels: true, views: true, column: true },
    });

    await this.amqpConnection.publish('project-exchange', 'card.moved', { card: updatedCard });
    return updatedCard;
  }
}
