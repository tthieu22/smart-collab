import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AutomationService } from './automation.service';

@Injectable()
export class AutomationConsumer {
  private readonly logger = new Logger(AutomationConsumer.name);

  constructor(private readonly automationService: AutomationService) {}

  @OnEvent('card.moved')
  async handleCardMoved(payload: any) {
    this.logger.log(`Received card.moved event for automation: ${payload.cardId}`);
    if (payload.projectId) {
      await this.automationService.processEvent(payload.projectId, 'CARD_MOVED', payload);
    }
  }

  @OnEvent('card.created')
  async handleCardCreated(payload: any) {
    this.logger.log(`Received card.created event for automation: ${payload.cardId}`);
    if (payload.projectId) {
      await this.automationService.processEvent(payload.projectId, 'CARD_CREATED', payload);
    }
  }
}
