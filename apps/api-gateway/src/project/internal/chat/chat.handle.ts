import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChatService } from './chat.service';

@Controller()
export class ChatHandler {
  private readonly logger = new Logger(ChatHandler.name);

  constructor(private readonly chatService: ChatService) {}

  @MessagePattern({ cmd: 'project.chat.send' })
  async handleSendMessage(@Payload() payload: any) {
    this.logger.log(`[project.chat.send] Payload: ${JSON.stringify(payload)}`);
    try {
      const result = await this.chatService.sendMessage({
        projectId: payload.projectId,
        userId: payload.userId,
        content: payload.payload.content,
        userName: payload.payload.userName,
        userAvatar: payload.payload.userAvatar,
        type: payload.payload.type,
        parentId: payload.payload.parentId,
        attachments: payload.payload.attachments,
        metadata: payload.payload.metadata,
      });
      return { success: true, data: result };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.chat.get_all' })
  async handleGetMessages(@Payload() payload: any) {
    try {
      const result = await this.chatService.getMessages(payload.projectId, payload.skip, payload.limit);
      return { success: true, data: result };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.chat.delete' })
  async handleDeleteMessage(@Payload() payload: any) {
    try {
      const result = await this.chatService.deleteMessage(payload.messageId, payload.userId);
      return { success: true, data: result };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
}
