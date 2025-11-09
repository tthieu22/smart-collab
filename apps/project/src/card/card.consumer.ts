import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { CardService } from './card.service';

@Injectable()
export class CardConsumer {
  constructor(private readonly cardService: CardService) {}

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'card.create',
    queue: 'project-service.card-create',
  })
  async handleCreateCard(msg: any) {
    try {
      await this.cardService.createCard(msg);
    } catch (error) {
      console.error('[CardConsumer] createCard failed:', error);
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'card.update',
    queue: 'project-service.card-update',
  })
  async handleUpdateCard(msg: any) {
    try {
      await this.cardService.updateCard(msg);
    } catch (error) {
      console.error('[CardConsumer] updateCard failed:', error);
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'card.delete',
    queue: 'project-service.card-delete',
  })
  async handleDeleteCard(msg: any) {
    try {
      await this.cardService.removeCard(msg.cardId);
    } catch (error) {
      console.error('[CardConsumer] removeCard failed:', error);
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'card.move',
    queue: 'project-service.card-move',
  })
  async handleMoveCard(msg: any) {
    try {
    console.log('[CardConsumer] Received message:', JSON.stringify(msg, null, 2));
      await this.cardService.moveCard(msg.cardId, msg.destColumnId, msg.destIndex);
    } catch (error) {
      console.error('[CardConsumer] moveCard failed:', error);
    }
  }

  @RabbitSubscribe({
    exchange: 'realtime-exchange',
    routingKey: 'card.get',
    queue: 'project-service.card-get',
  })
  async handleGetCard(msg: any) {
    try {
      await this.cardService.getCardById(msg.cardId);
    } catch (error) {
      console.error('[CardConsumer] getCardById failed:', error);
    }
  }
}
