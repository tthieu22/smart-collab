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
    members: true,
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
      include: this.CARD_INCLUDE_FULL,
    });
    this.logger.log(`Found ${cards.length} cards in column ${columnId}`);
    return cards;
  }

  async getCardsByProject(projectId: string) {
    this.logger.log(`Fetching cards for project id: ${projectId}`);
    const cards = await this.prisma.card.findMany({
      where: { projectId },
      orderBy: [{ columnId: 'asc' }, { position: 'asc' }],
      include: this.CARD_INCLUDE_FULL,
    });
    this.logger.log(`Found ${cards.length} cards in project ${projectId}`);
    return cards;
  }

  async createCard(params: {
    projectId: string;
    columnId: string;
    title: string;
    description?: string;
    correlationId?: string;
    status?: string;
    startDate?: Date;
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
    const cards = await this.prisma.card.findMany({
      where: { columnId: params.columnId },
      orderBy: { position: 'asc' },
    });
    const newPosition = cards.length;

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
        startDate: params.startDate ?? null,
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

    // 4. Chuẩn hóa lại toàn bộ vị trí trong cột này để đảm bảo tính liên tục (0, 1, 2...)
    await this.reorderCards(params.columnId);

    // 5. Chuẩn bị trả về (giữ nguyên correlationId nếu có)
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
    const actionHandlers: Record<string, () => Promise<any>> = {
      'update-basic': () => this.handleUpdateBasic(cardId, data, updatedById),
      'add-comment': () => this.handleAddComment(cardId, data, updatedById),
      'add-label': () => this.handleAddLabel(cardId, data),
      'remove-label': () => this.handleRemoveLabel(cardId, data),
      'add-checklist-item': () => this.handleAddChecklistItem(cardId, data),
      'update-checklist-item': () => this.handleUpdateChecklistItem(cardId, data),
      'remove-checklist-item': () => this.handleRemoveChecklistItem(cardId, data),
      'add-attachment': () => this.handleAddAttachment(cardId, data, updatedById),
      'remove-attachment': () => this.handleRemoveAttachment(cardId, data),
      'update-cover': () => this.handleUpdateCover(cardId, data, updatedById),
      'add-member': () => this.handleAddMember(cardId, data),
      'remove-member': () => this.handleRemoveMember(cardId, data),
    };

    const execute = actionHandlers[action];
    if (!execute) {
      throw new Error(`Unknown update action: ${action}`);
    }
    const updatedCard = await execute();

    await this.amqpConnection.publish("project-exchange", "card.updated", {
      card: updatedCard,
      action,
    });

    return updatedCard;
  }

  private async reorderCards(columnId: string | null, tx?: any) {
    if (!columnId) return;
    const client = tx || this.prisma;
    const cards = await client.card.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
    });
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].position !== i) {
        await client.card.update({
          where: { id: cards[i].id },
          data: { position: i },
        });
      }
    }
  }

  private async findCardDetailById(cardId: string) {
    return this.prisma.card.findUnique({
      where: { id: cardId },
      include: this.CARD_INCLUDE_FULL,
    });
  }

  private async handleUpdateBasic(cardId: string, data: any, updatedById?: string) {
    return this.prisma.card.update({
      where: { id: cardId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        deadline: data.deadline,
        priority: data.priority,
        updatedById,
      },
      include: this.CARD_INCLUDE_FULL,
    });
  }

  private async handleAddComment(cardId: string, data: any, updatedById?: string) {
    if (!updatedById) {
      throw new Error("updatedById is required for add-comment");
    }
    if (!data?.content || !String(data.content).trim()) {
      throw new Error("content is required");
    }
    await this.prisma.cardComment.create({
      data: {
        cardId,
        userId: updatedById,
        userName: String(data.userName || "User"),
        avatar: data.avatar ?? null,
        content: String(data.content).trim(),
      },
    });
    return this.findCardDetailById(cardId);
  }

  private async handleAddLabel(cardId: string, data: any) {
    await this.prisma.cardLabel.create({
      data: { 
        cardId, 
        label: data.label,
        color: data.color 
      },
    });
    return this.findCardDetailById(cardId);
  }

  private async handleRemoveLabel(cardId: string, data: any) {
    await this.prisma.cardLabel.delete({
      where: { id: data.labelId },
    });
    return this.findCardDetailById(cardId);
  }

  private async handleAddMember(cardId: string, data: any) {
    // Tránh add trùng
    const existing = await this.prisma.cardMember.findUnique({
      where: {
        cardId_userId: {
          cardId,
          userId: data.userId,
        },
      },
    });

    if (existing) return this.findCardDetailById(cardId);

    await this.prisma.cardMember.create({
      data: {
        cardId,
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
      },
    });
    return this.findCardDetailById(cardId);
  }

  private async handleRemoveMember(cardId: string, data: any) {
    await this.prisma.cardMember.delete({
      where: {
        cardId_userId: {
          cardId,
          userId: data.userId,
        },
      },
    });
    return this.findCardDetailById(cardId);
  }

  private async handleAddChecklistItem(cardId: string, data: any) {
    await this.prisma.checklistItem.create({
      data: {
        cardId,
        title: data.title,
        position: data.position ?? 0,
      },
    });
    return this.findCardDetailById(cardId);
  }

  private async handleUpdateChecklistItem(cardId: string, data: any) {
    await this.prisma.checklistItem.update({
      where: { id: data.itemId },
      data: {
        title: data.title,
        done: data.done,
      },
    });
    return this.findCardDetailById(cardId);
  }

  private async handleRemoveChecklistItem(cardId: string, data: any) {
    await this.prisma.checklistItem.delete({
      where: { id: data.itemId },
    });
    return this.findCardDetailById(cardId);
  }

  private async handleAddAttachment(cardId: string, data: any, updatedById?: string) {
    await this.prisma.attachment.create({
      data: {
        cardId,
        name: data.name,
        url: data.url,
        size: data.size,
        uploadedById: updatedById,
        publicId: data.publicId ?? null,
        fileType: data.fileType ?? null,
        fileSize: data.fileSize ?? null,
        resourceType: data.resourceType ?? null,
        originalFilename: data.originalFilename ?? null,
      },
    });
    return this.findCardDetailById(cardId);
  }

  private async handleRemoveAttachment(cardId: string, data: any) {
    await this.prisma.attachment.delete({
      where: { id: data.attachmentId },
    });
    return this.findCardDetailById(cardId);
  }

  private async handleUpdateCover(cardId: string, data: any, updatedById?: string) {
    return this.prisma.card.update({
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
    projectId?: string;
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

    if (projectId && card.projectId !== projectId) {
      throw new Error('Card does not belong to this project');
    }

    const currentColumnId = card.columnId;
    const isSameColumn = currentColumnId === destColumnId;

    // 2. Validate destination column
    const destColumn = await this.prisma.column.findUnique({
      where: { id: destColumnId },
      select: { id: true, projectId: true },
    });

    if (!destColumn) {
      throw new Error('Destination column not found');
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
            projectId: destColumn.projectId ?? null,
            position: destIndex,
            updatedById: movedById,
          },
          include: { labels: true, views: true, column: true },
        });
      }

      // 4. Chuẩn hóa lại toàn bộ vị trí ở cả 2 cột (hoặc 1 cột nếu di chuyển nội bộ)
      await this.reorderCards(currentColumnId, tx);
      if (destColumnId !== currentColumnId) {
        await this.reorderCards(destColumnId, tx);
      }

      // Lấy lại dữ liệu card sau khi đã chuẩn hóa vị trí
      return tx.card.findUnique({
        where: { id: cardId },
        include: { labels: true, views: true, column: true },
      });
    }, {
      timeout: 30000
    });

    if (!result) {
      throw new Error(`Card ${cardId} not found after move`);
    }

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
      projectId: result.projectId ?? null,
      correlationId,
    });

    this.logger.log(`Published card.moved event for card ${cardId}`);
    return responseData;
  }

  async copyCard(params: {
    cardId: string;
    destColumnId: string;
    destIndex?: number;
    projectId?: string;
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

    if (projectId && originalCard.projectId !== projectId) {
      throw new Error('Card does not belong to this project');
    }

    const destColumn = await this.prisma.column.findUnique({
      where: { id: destColumnId },
      select: { id: true, projectId: true },
    });

    if (!destColumn) {
      throw new Error('Destination column not found');
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

      const created = await tx.card.create({
        data: {
          projectId: destColumn.projectId ?? null,
          columnId: destColumnId,
          title: `${originalCard.title} (Copy)`,
          description: originalCard.description,
          status: originalCard.status,
          startDate: originalCard.startDate,
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

      await this.reorderCards(destColumnId, tx);
      return created;
    }, {
      timeout: 30000
    });

    // 4. Publish event
    await this.amqpConnection.publish('project-exchange', 'card.copied', {
      card: newCard,
      originalCardId: cardId,
      copiedById,
      srcColumnId,
      destColumnId,
      destIndex: finalPosition,
      projectId: newCard.projectId ?? null,
      correlationId,
    });

    this.logger.log(`Published card.copied event for new card ${newCard.id}`);
    return newCard;
  }
  
  private async getNextPosition(columnId: string): Promise<number> {
    const count = await this.prisma.card.count({
      where: { columnId },
    });
    return count;
  }
}
