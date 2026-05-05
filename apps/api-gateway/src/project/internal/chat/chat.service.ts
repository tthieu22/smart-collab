import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async sendMessage(params: {
    projectId: string;
    userId: string;
    content: string;
    userName?: string;
    userAvatar?: string;
    type?: string;
    parentId?: string;
    attachments?: any;
    metadata?: any;
  }) {
    const { projectId, userId, content, userName, userAvatar, type, parentId, attachments, metadata } = params;

    const message = await this.prisma.projectChatMessage.create({
      data: {
        projectId,
        userId,
        content,
        userName: userName || 'User',
        avatar: userAvatar,
        type: type || 'TEXT',
        parentId,
        attachments,
        metadata,
      },
      include: {
        replyTo: true,
      },
    });

    // Notify realtime service via EventEmitter2
    this.eventEmitter.emit('realtime.project.chat', {
      projectId,
      message,
    });

    return message;
  }

  async getMessages(projectId: string, skip: number = 0, limit: number = 20) {
    return this.prisma.projectChatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      skip: Number(skip) || 0,
      take: Number(limit) || 20,
      include: {
        replyTo: true,
      },
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
