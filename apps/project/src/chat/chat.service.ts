import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async sendMessage(params: {
    projectId: string;
    userId: string;
    content: string;
    userName?: string;
    userAvatar?: string;
  }) {
    const { projectId, userId, content, userName, userAvatar } = params;

    const message = await this.prisma.projectChatMessage.create({
      data: {
        projectId,
        userId,
        content,
        userName: userName || 'User',
        avatar: userAvatar,
      },
    });

    // Notify realtime service via RabbitMQ
    await this.amqpConnection.publish('smart-collab', 'realtime.project.chat', {
      projectId,
      message,
    });

    return message;
  }

  async getMessages(projectId: string, limit: number = 50) {
    return this.prisma.projectChatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const msg = await this.prisma.projectChatMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.userId !== userId) {
      throw new Error('Unauthorized or message not found');
    }

    return this.prisma.projectChatMessage.delete({ where: { id: messageId } });
  }
}
