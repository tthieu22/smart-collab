import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CardService } from './card.service';

@Controller()
export class CardHandler {
  private readonly logger = new Logger(CardHandler.name);

  constructor(private readonly cardService: CardService) {}

  @MessagePattern({ cmd: 'project.get.card' })
  async handleGetDetail(@Payload() cardId: string) {
    this.logger.log(`Handling get.card request with cardId: ${cardId}`);
    try {
      const card = await this.cardService.getCardDetail(cardId);
      return { success: true, message: 'OK', data: card };
    } catch (error: any) {
      this.logger.error(`Error handling get.card: ${error.message}`, error.stack);
      return { success: false, message: error.message || 'Card not found' };
    }
  }

  @MessagePattern({ cmd: 'project.get.cardsByColumn' })
  async handleGetCardsByColumn(@Payload() columnId: string) {
    this.logger.log(`Handling get.cardsByColumn request for columnId: ${columnId}`);
    try {
      const cards = await this.cardService.getCardsByColumn(columnId);
      return { success: true, data: cards };
    } catch (error: any) {
      this.logger.error(`Error handling get.cardsByColumn: ${error.message}`, error.stack);
      return { success: false, message: error.message || 'Cards not found' };
    }
  }

  @MessagePattern({ cmd: 'project.get.cardsByProject' })
  async handleGetCardsByProject(@Payload() projectId: string) {
    this.logger.log(
      `Handling get.cardsByProject request for projectId: ${projectId}`,
    );
    try {
      const cards = await this.cardService.getCardsByProject(projectId);
      return { success: true, data: cards };
    } catch (error: any) {
      this.logger.error(
        `Error handling get.cardsByProject: ${error.message}`,
        error.stack,
      );
      return { success: false, message: error.message || 'Cards not found' };
    }
  }

  @MessagePattern({ cmd: 'project.card.create' })
  async handleCreateCard(@Payload() payload: any) {
    this.logger.log(`[handleCreateCard] Received payload: ${JSON.stringify(payload)}`);
    try {
      const mergedParams = {
        projectId: payload.projectId,
        correlationId: payload.correlationId,
        ...payload.payload,
        createdById: payload.userId,
      };

      this.logger.debug(`[handleCreateCard] Final params passed to createCard: ${JSON.stringify(mergedParams)}`);

      const result = await this.cardService.createCard(mergedParams);

      this.logger.log(`[handleCreateCard] Card created successfully: ${JSON.stringify(result)}`);
      return { status: 'success', correlationId: payload.correlationId, data: result };
    } catch (error: any) {
      this.logger.error(`[handleCreateCard] Error creating card: ${error.message}`, error.stack);
      return { status: 'error', message: error.message };
    }
  }


  @MessagePattern({ cmd: 'project.card.update' })
  async handleUpdateCard(@Payload() payload: any) {
    this.logger.log(`Updating card with payload: ${JSON.stringify(payload)}`);
    try {
      const mergedParams = {
        projectId: payload.projectId,
        correlationId: payload.correlationId,
        ...payload.payload,
        updatedById: payload.userId ?? payload.payload?.updatedById,
      };
      const result = await this.cardService.updateCard(mergedParams);
      this.logger.log(`Card updated successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Error updating card: ${error.message}`, error.stack);
      return { status: 'error', message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.card.delete' })
  async handleDeleteCard(@Payload() payload: any) {
    this.logger.log(`Deleting card with payload: ${JSON.stringify(payload)}`);
    try {
      const cardId = payload.cardId || payload.payload?.cardId;
      if (!cardId) throw new Error('cardId is required');

      const result = await this.cardService.removeCard(cardId);
      this.logger.log(`Card deleted successfully: ${cardId}`);
      return { status: 'success', data: result };
    } catch (error: any) {
      this.logger.error(`Error deleting card: ${error.message}`, error.stack);
      return { status: 'error', message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.card.move' })
  async handleMoveCard(@Payload() payload: any) {
    this.logger.log(`[handleMoveCard] Payload: ${JSON.stringify(payload)}`);
    try {
      const mergedParams = {
        projectId: payload.projectId,
        correlationId: payload.correlationId,
        ...payload.payload,
        movedById: payload.userId,
      };

      this.logger.debug(`[handleMoveCard] mergedParams: ${JSON.stringify(mergedParams)}`);

      const result = await this.cardService.moveCard(mergedParams);
      this.logger.log(`[handleMoveCard] Success: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) {
      this.logger.error(`[handleMoveCard] ${error.message}`, error.stack);
      return { status: 'error', message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.card.copy' })
  async handleCopyCard(@Payload() payload: any) {
    this.logger.log(`[handleCopyCard] Payload: ${JSON.stringify(payload)}`);
    try {
      // LẤY userId TRƯỚC để tránh bị ghi đè
      const userId = payload.userId;

      const mergedParams = {
        projectId: payload.projectId,
        correlationId: payload.correlationId,
        ...payload.payload,
        copiedById: userId,
        ...(payload.payload?.userId ? { userId: undefined } : {}),
      };

      this.logger.debug(`[handleCopyCard] mergedParams: ${JSON.stringify(mergedParams)}`);

      const result = await this.cardService.copyCard(mergedParams);
      this.logger.log(`[handleCopyCard] Success: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) {
      this.logger.error(`[handleCopyCard] ${error.message}`, error.stack);
      return { status: 'error', message: error.message };
    }
  }
  @MessagePattern({ cmd: 'project.card.restore' })
  async handleRestoreCard(@Payload() payload: any) {
    this.logger.log(`Restoring card with payload: ${JSON.stringify(payload)}`);
    try {
      const result = await this.cardService.restoreCard(payload.cardId);
      return { success: true, data: result };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.custom-field.create' })
  async handleCreateCustomField(@Payload() payload: any) {
    try {
      const result = await this.cardService.createCustomFieldDefinition(payload);
      return { success: true, data: result };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.custom-field.get_all' })
  async handleGetCustomFields(@Payload() payload: any) {
    try {
      const result = await this.cardService.getCustomFieldDefinitions(payload.projectId);
      return { success: true, data: result };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.custom-field.delete' })
  async handleDeleteCustomField(@Payload() payload: any) {
    try {
      const result = await this.cardService.deleteCustomFieldDefinition(payload.fieldId);
      return { success: true, data: result };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
}
