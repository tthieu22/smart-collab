import { Injectable } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CardMessage } from '../dto/card.dto';

@Injectable()
export class CardConsumer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly prisma: PrismaService,
  ) {}

  // ------------------- Move Card -------------------
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'card.move',
    queue: 'project-service.card_move',
  })
  async handleMoveCard(msg: CardMessage) {
    try {
      // Lấy cardView hiện tại
      const cardView = await this.prisma.cardView.findUnique({
        where: { id: msg.cardViewId! },
      });

      if (!cardView) throw new Error('CardView not found');

      // Check version để tránh xung đột
      if (cardView.version !== msg.version) {
        throw new Error('Version conflict');
      }

      // Move card: cập nhật position, columnId, componentType, version++
      const updatedCardView = await this.prisma.cardView.update({
        where: { id: msg.cardViewId! },
        data: {
          position: msg.position!,
          columnId: msg.toColumnId ?? null,
          componentType: msg.toComponentId!,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      await this.amqpConnection.publish('project-exchange', 'card.moved', {
        correlationId: msg.correlationId,
        cardView: updatedCardView,
      });
    } catch (error) {
      console.error('❌ handleMoveCard error:', error);
      await this.amqpConnection.publish('project-exchange', 'card.moved', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ------------------- Copy Card -------------------
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'card.copy',
    queue: 'project-service.card_copy',
  })
  async handleCopyCard(msg: CardMessage) {
    try {
      const newCardView = await this.prisma.cardView.create({
        data: {
          cardId: msg.cardId!,
          projectId: msg.projectId!,
          columnId: msg.toColumnId ?? null,
          componentType: msg.toComponentId!,
          position: msg.position!,
          version: 1,
          isPinned: msg.isPinned ?? false,
          customTitle: msg.customTitle,
          metadata: msg.metadata,
          updatedAt: new Date(),
        },
      });

      await this.amqpConnection.publish('project-exchange', 'card.copied', {
        correlationId: msg.correlationId,
        cardView: newCardView,
      });
    } catch (error) {
      console.error('❌ handleCopyCard error:', error);
      await this.amqpConnection.publish('project-exchange', 'card.copied', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ------------------- Delete CardView -------------------
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'card.delete',
    queue: 'project-service.card_delete',
  })
  async handleDeleteCard(msg: CardMessage) {
    try {
      await this.prisma.cardView.delete({
        where: { id: msg.cardViewId! },
      });

      await this.amqpConnection.publish('project-exchange', 'card.deleted', {
        correlationId: msg.correlationId,
        cardViewId: msg.cardViewId,
      });
    } catch (error) {
      console.error('❌ handleDeleteCard error:', error);
      await this.amqpConnection.publish('project-exchange', 'card.deleted', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
