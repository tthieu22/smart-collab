import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly amqpConnection: AmqpConnection,
  ) { }
  
  private readonly CARD_INCLUDE_FULL = {
    labels: true,
    views: true,
    comments: {
      orderBy: [{ createdAt: "asc" as const }],
    },
    checklist: {
      orderBy: [{ position: "asc" as const }],
    },
    attachments: {
      orderBy: [{ uploadedAt: "desc" as const }],
    },
    column: true,
    project: true,
  };

  async getCardDetail(cardId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: this.CARD_INCLUDE_FULL,
    });
    return card ?? null;
  }


  async getCardsByColumn(columnId: string) {
    this.logger.log(`Fetching cards for column id: ${columnId}`);
    const cards = await this.prisma.card.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
      include: { labels: true, views: true, column: true },
    });
    this.logger.log(`Found ${cards.length} cards in column ${columnId}`);
    return cards;
  }

  async createCard(params: {
    projectId: string;
    columnId: string;
    title: string;
    description?: string;
    correlationId?: string;
    status?: string;
    deadline?: Date;
    priority?: number;
    createdById?: string;
  }) {
    this.logger.log(`Creating card with params: ${JSON.stringify(params)}`);

    const column = await this.prisma.column.findUnique({ where: { id: params.columnId } });
    if (!column) {
      this.logger.error(`Column not found with id: ${params.columnId}`);
      throw new Error('Column not found');
    }

    // 1. Tính position mới (chèn cuối)
    const lastPosition = await this.prisma.card.findFirst({
      where: { columnId: params.columnId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const newPosition = (lastPosition?.position ?? -1) + 1;

    // 2. Lấy thông tin người tạo (nếu có)
    let createdByName: string | null = null;
    let createdByAvatar: string | null = null;
    // if (params.createdById) {
    //   const user = await this.prisma.user.findUnique({
    //     where: { id: params.createdById },
    //     select: { name: true, avatar: true },
    //   });
    //   createdByName = user?.name ?? null;
    //   createdByAvatar = user?.avatar ?? null;
    // }

    // 3. Tạo card mới đầy đủ thông tin
    const card = await this.prisma.card.create({
      data: {
        columnId: params.columnId,
        projectId: column.projectId,
        title: params.title,
        description: params.description ?? null,
        status: params.status ?? 'ACTIVE',
        deadline: params.deadline ?? null,
        priority: params.priority ?? null,
        position: newPosition,
        createdById: params.createdById ?? null,
        createdByName,
        createdByAvatar,
        updatedById: params.createdById ?? null,
        updatedByName: createdByName,
        updatedByAvatar: createdByAvatar,
      },
      include: {
        labels: true,
        views: true,
        comments: true,
        checklist: true,
        attachments: true,
        column: true,
        project: true,
      },
    });

    // 4. Chuẩn bị trả về (giữ nguyên correlationId nếu có)
    const cardToReturn = {
      correlationId: params.correlationId,
      ...card,
    };

    this.logger.log(`Card created with ID: ${card.id}, publishing event...`);
    // await this.amqpConnection.publish('project-exchange', 'card.created', { card: cardToReturn });
    this.logger.log(`Published card.created event for card ID: ${card.id}`);

    return cardToReturn;
  }

  
  async updateCard(params: {
    cardId: string;
    action: string;
    data: any;
    updatedById?: string;
  }) {
    const { cardId, action, data, updatedById } = params;

    let updatedCard;

    switch (action) {
      case "update-basic":
        updatedCard = await this.prisma.card.update({
          where: { id: cardId },
          data: {
            title: data.title,
            description: data.description,
            status: data.status,
            deadline: data.deadline,
            priority: data.priority,
            updatedById,
          },
          include: this.CARD_INCLUDE_FULL,
        });
        break;

      case "add-label":
        await this.prisma.cardLabel.create({
          data: { cardId, label: data.label },
        });
        updatedCard = await this.prisma.card.findUnique({
          where: { id: cardId },
          include: this.CARD_INCLUDE_FULL,
        });
        break;

      case "remove-label":
        await this.prisma.cardLabel.delete({
          where: { id: data.labelId },
        });
        updatedCard = await this.prisma.card.findUnique({
          where: { id: cardId },
          include: this.CARD_INCLUDE_FULL,
        });
        break;

      case "add-checklist-item":
        await this.prisma.checklistItem.create({
          data: {
            cardId,
            title: data.title,
            position: data.position ?? 0,
          },
        });
        updatedCard = await this.prisma.card.findUnique({
          where: { id: cardId },
          include: this.CARD_INCLUDE_FULL,
        });
        break;

      case "update-checklist-item":
        await this.prisma.checklistItem.update({
          where: { id: data.itemId },
          data: {
            title: data.title,
            done: data.done,
          },
        });
        updatedCard = await this.prisma.card.findUnique({
          where: { id: cardId },
          include: this.CARD_INCLUDE_FULL,
        });
        break;

      case "remove-checklist-item":
        await this.prisma.checklistItem.delete({
          where: { id: data.itemId },
        });
        updatedCard = await this.prisma.card.findUnique({
          where: { id: cardId },
          include: this.CARD_INCLUDE_FULL,
        });
        break;

      case "add-attachment":
        await this.prisma.attachment.create({
          data: {
            cardId,
            name: data.name,
            url: data.url,
            size: data.size,
            uploadedById: updatedById,
          },
        });
        updatedCard = await this.prisma.card.findUnique({
          where: { id: cardId },
          include: this.CARD_INCLUDE_FULL,
        });
        break;

      case "remove-attachment":
        await this.prisma.attachment.delete({
          where: { id: data.attachmentId },
        });
        updatedCard = await this.prisma.card.findUnique({
          where: { id: cardId },
          include: this.CARD_INCLUDE_FULL,
        });
        break;

      case "update-cover":
        updatedCard = await this.prisma.card.update({
          where: { id: cardId },
          data: {
            coverUrl: data.coverUrl,
            coverPublicId: data.coverPublicId,
            coverFilename: data.coverFilename,
            coverFileSize: data.coverFileSize,
            updatedById,
          },
          include: this.CARD_INCLUDE_FULL,
        });
        break;

      default:
        throw new Error(`Unknown update action: ${action}`);
    }

    await this.amqpConnection.publish("project-exchange", "card.updated", {
      card: updatedCard,
      action,
    });

    return updatedCard;
  }


  async removeCard(cardId: string) {
    this.logger.log(`Removing card with ID: ${cardId}`);

    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      this.logger.error(`Card not found with id: ${cardId}`);
      throw new Error('Card not found');
    }

    await this.prisma.card.delete({ where: { id: cardId } });

    this.logger.log(`Card deleted with ID: ${cardId}, publishing event...`);
    await this.amqpConnection.publish('project-exchange', 'card.deleted', { cardId });
    this.logger.log(`Published card.deleted event for card ID: ${cardId}`);

    return { cardId };
  }

  async moveCard(params: {
    cardId: string;
    destColumnId: string;
    destIndex: number;
    projectId: string;
    correlationId?: string;
    movedById: string;
    srcColumnId?: string;
    srcBoardId?: string;
    destBoardId?: string;
  }) {
    const {
      cardId,
      destColumnId,
      destIndex,
      projectId,
      movedById,
      srcColumnId,
      correlationId,
    } = params;

    this.logger.log(
      `Moving card ${cardId} → column ${destColumnId} @ index ${destIndex} by user ${movedById}`
    );

    // 1. Lấy card hiện tại
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true, columnId: true, position: true, projectId: true },
    });

    if (!card) {
      throw new Error('Card not found');
    }

    if (card.projectId !== projectId) {
      throw new Error('Card does not belong to this project');
    }

    const currentColumnId = card.columnId;
    const isSameColumn = currentColumnId === destColumnId;

    // 2. Validate destination column
    const destColumn = await this.prisma.column.findUnique({
      where: { id: destColumnId },
      select: { id: true, projectId: true },
    });

    if (!destColumn || destColumn.projectId !== projectId) {
      throw new Error('Destination column not found or not in project');
    }

    // 3. Bắt đầu transaction: cập nhật position + card
    const result = await this.prisma.$transaction(async (tx) => {
      let updatedCard;

      if (isSameColumn) {
        // --- TRƯỜNG HỢP 1: Di chuyển trong cùng cột ---
        if (card.position === destIndex) {
          // Không thay đổi vị trí
          updatedCard = await tx.card.update({
            where: { id: cardId },
            data: { updatedById: movedById },
            include: { labels: true, views: true, column: true },
          });
        } else {
          // Cập nhật position của các card khác
          const adjustment = card.position < destIndex ? -1 : 1;
          await tx.card.updateMany({
            where: {
              columnId: destColumnId,
              position: {
                gte: Math.min(card.position, destIndex),
                lte: Math.max(card.position, destIndex),
              },
              id: { not: cardId },
            },
            data: { position: { increment: adjustment } },
          });

          updatedCard = await tx.card.update({
            where: { id: cardId },
            data: {
              position: destIndex,
              updatedById: movedById,
            },
            include: { labels: true, views: true, column: true },
          });
        }
      } else {
        // --- TRƯỜNG HỢP 2: Di chuyển sang cột khác ---
        // 1. Dọn dẹp cột cũ: giảm position các card sau vị trí cũ
        if (currentColumnId) {
          await tx.card.updateMany({
            where: {
              columnId: currentColumnId,
              position: { gt: card.position },
            },
            data: { position: { decrement: 1 } },
          });
        }

        // 2. Dọn dẹp cột mới: tăng position các card từ destIndex trở đi
        await tx.card.updateMany({
          where: {
            columnId: destColumnId,
            position: { gte: destIndex },
          },
          data: { position: { increment: 1 } },
        });

        // 3. Cập nhật card
        updatedCard = await tx.card.update({
          where: { id: cardId },
          data: {
            columnId: destColumnId,
            position: destIndex,
            updatedById: movedById,
          },
          include: { labels: true, views: true, column: true },
        });
      }

      return updatedCard;
    });
    const responseData = {
      srcColumnId: isSameColumn ? destColumnId : currentColumnId,
      newColumnId: result.columnId,
      cardId: result.id,
      newIndex: result.position,
      ...result,
    };
    // 4. Publish event
    await this.amqpConnection.publish('project-exchange', 'card.moved', {
      card: result,
      movedById,
      srcColumnId: isSameColumn ? destColumnId : currentColumnId,
      destColumnId,
      destIndex,
      projectId,
      correlationId,
    });

    this.logger.log(`Published card.moved event for card ${cardId}`);
    return responseData;
  }

  async copyCard(params: {
    cardId: string;
    destColumnId: string;
    destIndex?: number;
    projectId: string;
    correlationId?: string;
    copiedById: string;
    srcColumnId?: string;
    srcBoardId?: string;
    destBoardId?: string;
  }) {
    const {
      cardId,
      destColumnId,
      destIndex,
      projectId,
      copiedById,
      srcColumnId,
      correlationId,
    } = params;

    this.logger.log(
      `Copying card ${cardId} → column ${destColumnId} @ index ${destIndex ?? 'auto'} by user ${copiedById}`
    );

    // 1. Lấy card gốc
    const originalCard = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { labels: true },
    });

    if (!originalCard) {
      throw new Error('Original card not found');
    }

    if (originalCard.projectId !== projectId) {
      throw new Error('Card does not belong to this project');
    }

    // 2. Tính position (nếu không có destIndex → chèn cuối)
    const finalPosition = destIndex ?? await this.getNextPosition(destColumnId);

    // 3. Tạo card mới trong transaction
    const newCard = await this.prisma.$transaction(async (tx) => {
      // Tăng position các card từ finalPosition trở đi
      if (destIndex !== undefined) {
        await tx.card.updateMany({
          where: { columnId: destColumnId, position: { gte: finalPosition } },
          data: { position: { increment: 1 } },
        });
      }

      return await tx.card.create({
        data: {
          projectId: originalCard.projectId,
          columnId: destColumnId,
          title: `${originalCard.title} (Copy)`,
          description: originalCard.description,
          status: originalCard.status,
          deadline: originalCard.deadline,
          priority: originalCard.priority,
          position: finalPosition,
          createdById: copiedById,
          updatedById: copiedById,
          labels: {
            create: originalCard.labels.map((l) => ({ label: l.label })),
          },
        },
        include: { labels: true, views: true, column: true },
      });
    });

    // 4. Publish event
    await this.amqpConnection.publish('project-exchange', 'card.copied', {
      card: newCard,
      originalCardId: cardId,
      copiedById,
      srcColumnId,
      destColumnId,
      destIndex: finalPosition,
      projectId,
      correlationId,
    });

    this.logger.log(`Published card.copied event for new card ${newCard.id}`);
    return newCard;
  }
  
  private async getNextPosition(columnId: string): Promise<number> {
    const lastCard = await this.prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (lastCard?.position ?? -1) + 1;
  }
}
