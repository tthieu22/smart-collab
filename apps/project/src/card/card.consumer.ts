import { Injectable } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CardService } from './card.service';

@Injectable()
export class CardConsumer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly cardService: CardService,
  ) {}

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'card.get',
    queue: 'project-service.card-get',
  })
  async handleGetCard(msg: { cardId: string }) {
    try {
      const card = await this.cardService.getCardById(msg.cardId);
      await this.amqpConnection.publish('project-exchange', 'card.result', {
        status: 'success',
        action: 'get',
        card,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'card.result', {
        status: 'error',
        action: 'get',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'card.create',
    queue: 'project-service.card-create',
  })
  async handleCreateCard(msg: {
    columnId: string;
    title: string;
    description?: string;
    status?: string;
    deadline?: Date;
    priority?: number;
    createdById?: string;
  }) {
    try {
      const card = await this.cardService.createCard(msg);
      await this.amqpConnection.publish('project-exchange', 'card.result', {
        status: 'success',
        action: 'create',
        card,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'card.result', {
        status: 'error',
        action: 'create',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'card.update',
    queue: 'project-service.card-update',
  })
  async handleUpdateCard(msg: {
    cardId: string;
    title?: string;
    description?: string;
    status?: string;
    deadline?: Date;
    priority?: number;
    updatedById?: string;
  }) {
    try {
      const card = await this.cardService.updateCard(msg);
      await this.amqpConnection.publish('project-exchange', 'card.result', {
        status: 'success',
        action: 'update',
        card,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'card.result', {
        status: 'error',
        action: 'update',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'card.delete',
    queue: 'project-service.card-delete',
  })
  async handleDeleteCard(msg: { cardId: string }) {
    try {
      const result = await this.cardService.removeCard(msg.cardId);
      await this.amqpConnection.publish('project-exchange', 'card.result', {
        status: 'success',
        action: 'delete',
        ...result,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'card.result', {
        status: 'error',
        action: 'delete',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'card.move',
    queue: 'project-service.card-move',
  })
  async handleMoveCard(msg: { cardId: string; destColumnId: string; destIndex: number }) {
    try {
      const card = await this.cardService.moveCard(msg.cardId, msg.destColumnId, msg.destIndex);
      await this.amqpConnection.publish('project-exchange', 'card.result', {
        status: 'success',
        action: 'move',
        card,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'card.result', {
        status: 'error',
        action: 'move',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
