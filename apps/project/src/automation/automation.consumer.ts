import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { AutomationService } from './automation.service';

@Injectable()
export class AutomationConsumer {
  private readonly logger = new Logger(AutomationConsumer.name);

  constructor(private readonly automationService: AutomationService) {}

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'card.moved',
    queue: 'automation-card-moved-queue',
  })
  async handleCardMoved(payload: any) {
    this.logger.log(`Received card.moved event for automation: ${payload.cardId}`);
    if (payload.projectId) {
      await this.automationService.processEvent(payload.projectId, 'CARD_MOVED', payload);
    }
  }

  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'card.created',
    queue: 'automation-card-created-queue',
  })
  async handleCardCreated(payload: any) {
    this.logger.log(`Received card.created event for automation: ${payload.cardId}`);
    if (payload.projectId) {
      await this.automationService.processEvent(payload.projectId, 'CARD_CREATED', payload);
    }
  }
}
