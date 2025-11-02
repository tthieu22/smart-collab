import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { CardService } from "./card.service";

@Controller()
export class CardHandler {
  private readonly logger = new Logger(CardHandler.name);

  constructor(private readonly cardService: CardService) {}

  @MessagePattern({ cmd: 'project.get.card' })
  async handleGetDetail(@Payload() id: string) {
    this.logger.log(`Handling get.card request with id: ${id}`);

    try {
      const card = await this.cardService.getCardDetail(id);
      return {
        success: true,
        message: 'OK',
        data: card,
      };
    } catch (error: any) {
      this.logger.error(`Error handling get.card: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || 'Card not found',
      };
    }
  }

  @MessagePattern({ cmd: 'project.get.cardsByColumn' })
  async handleGetCardsByColumn(@Payload() columnId: string) {
    try {
      const cards = await this.cardService.getCardsByColumn(columnId);
      return {
        success: true,
        data: cards,
      };
    } catch (error: any) {
      this.logger.error(`Error handling get.cardsByColumn: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || 'Cards not found',
      };
    }
  }
}
