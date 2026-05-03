import { Injectable, Logger } from '@nestjs/common';
import { AuthPrismaService } from '../../../../prisma/prisma.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async updateMood(userId: string, mood: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { mood } as any,
    });
  }

  async createPost(userId: string, data: any) {
    return this.prisma.post.create({
      data: {
        authorId: userId,
        content: data.content,
        title: data.title,
        linkUrl: data.linkUrl,
        media: data.media || [],
        visibility: data.visibility || 'public',
        mood: data.mood,
        backgroundStyle: data.backgroundStyle,
      },
    });
  }

  async likePost(postId: string, userId: string, type: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');

    const reaction = await this.prisma.reaction.upsert({
      where: {
        postId_authorId: { postId, authorId: userId },
      },
      update: {
        type: type.toUpperCase(),
      },
      create: {
        postId,
        authorId: userId,
        type: type.toUpperCase(),
      },
    });

    await this.createNotification(post.authorId, userId, 'LIKE', postId, undefined);
    return reaction;
  }

  async addComment(postId: string, userId: string, content: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content,
      },
    });

    await this.createNotification(post.authorId, userId, 'COMMENT', postId, comment.id);
    return comment;
  }

  async followUser(followerId: string, targetId: string) {
    if (followerId === targetId) throw new Error('Cannot follow self');
    const res = await this.prisma.follower.upsert({
      where: {
        followerId_followingId: { followerId, followingId: targetId },
      },
      update: {},
      create: { followerId, followingId: targetId },
    });
    await this.createNotification(targetId, followerId, 'FOLLOW', undefined, undefined);
    return res;
  }

  async unfollowUser(followerId: string, targetId: string) {
    return this.prisma.follower.deleteMany({
      where: { followerId, followingId: targetId },
    });
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true },
    });
  }

  async createNews(userId: string, data: any) {
    return this.prisma.newsArticle.create({
      data: {
        authorId: userId,
        category: data.category || 'NEWS',
        title: data.title || 'Untitled',
        content: data.content,
        linkUrl: data.linkUrl,
        media: data.media || [],
      },
    });
  }

  async updateNews(userId: string, data: any) {
    return this.prisma.newsArticle.update({
      where: { id: data.id },
      data: {
        category: data.category,
        title: data.title,
        content: data.content,
        linkUrl: data.linkUrl,
        media: data.media,
      },
    });
  }

  async deleteNews(userId: string, id: string) {
    return this.prisma.newsArticle.delete({ where: { id } });
  }

  async getPost(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        reactions: true,
        _count: { select: { comments: true } },
      },
    });

    if (!post) return null;

    const summary = post.reactions.reduce((acc: any, r: any) => {
      const type = r.type.toLowerCase();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 });

    const myReaction = post.reactions.find((r: any) => r.authorId === userId);

    return {
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      media: post.media,
      createdAt: post.createdAt,
      commentCount: post._count.comments,
      shareCount: 0,
      reactionSummary: summary,
      myReaction: myReaction ? myReaction.type.toLowerCase() : null,
      bookmarkedByMe: false,
      visibility: post.visibility || 'public',
      mood: post.mood,
      title: post.title,
      author: {
        id: post.author.id,
        name: `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim(),
        username: post.author.email ? post.author.email.split('@')[0] : 'user',
        avatarUrl: post.author.avatar,
      }
    };
  }

  async getComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sharePost(postId: string, userId: string) {
    // Basic share implementation: increment share count if we had a counter, 
    // or just notify the author. Here we just notify.
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    
    await this.createNotification(post.authorId, userId, 'SHARE', postId);
    return { success: true };
  }

  async createNotification(
    recipientId: string,
    senderId: string,
    type: string,
    postId?: string,
    commentId?: string,
    projectId?: string,
    projectName?: string,
  ) {
    if (recipientId === senderId) return;

    const notification = await this.prisma.notification.create({
      data: {
        recipientId,
        senderId,
        type,
        postId,
        commentId,
        projectId,
        projectName,
        isRead: false,
      },
    });

    // Publish to RabbitMQ for Realtime service
    this.amqpConnection.publish('notification_exchange', 'notification_routing_key', {
      id: notification.id,
      recipientId,
      senderId,
      type,
      postId,
      commentId,
      projectId,
      projectName,
      createdAt: notification.createdAt,
    });
  }
}
