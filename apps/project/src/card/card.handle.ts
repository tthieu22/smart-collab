import { Controller, Logger } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { CardService } from "./card.service";

@Controller()
export class AuthMessageHandler {
  private readonly logger = new Logger(AuthMessageHandler.name);
  constructor(
    private readonly cardService: CardService,
  ) {}
  @MessagePattern({ cmd: 'project.get.card' })
  async handleGetDetail(id: string) {
    try {
      const user = await this.cardService.getCardDetail(id);
      return {
        success: true,
        message: 'OK',
        data: user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'User not found',
      };
    }
  }
}