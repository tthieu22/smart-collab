import { Controller, Logger, OnModuleInit } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HomeService } from '../services/home.service';
import { SocialService } from '../services/social.service';
import { AutoPostService } from '../services/auto-post.service';

@Controller()
export class HomeMessageHandler implements OnModuleInit {
  private readonly logger = new Logger(HomeMessageHandler.name);

  constructor(
    private readonly homeService: HomeService,
    private readonly socialService: SocialService,
    private readonly autoPostService: AutoPostService,
  ) {}

  onModuleInit() {
    this.logger.log('HomeMessageHandler initialized and ready for patterns');
  }

  @MessagePattern({ cmd: 'home.feed.get' })
  async handleGetFeed(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      const result = await this.homeService.getFeed(
        userId,
        payload.page != null ? Number(payload.page) : 0,
        payload.limit != null ? Number(payload.limit) : 10,
        payload.excludeIds 
          ? (Array.isArray(payload.excludeIds) 
              ? payload.excludeIds 
              : typeof payload.excludeIds === 'string' 
                ? payload.excludeIds.split(',').filter((id: string) => id.trim().length > 0)
                : [payload.excludeIds]) 
          : []
      );
      return { success: true, data: result };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.user.mood.update' })
  async handleUpdateUserMood(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      const user = await this.socialService.updateMood(userId, payload.mood);
      return { success: true, data: user };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.post.create' })
  async handleCreatePost(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      const post = await this.socialService.createPost(userId, payload);
      return { success: true, data: post };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.post.get' })
  async handleGetPost(@Payload() data: any) {
    try {
      const { payload, userId } = data;
      const post = await this.homeService.getPostById(payload.postId, userId);
      return { success: true, data: post };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.post.comments.get' })
  async handleGetComments(@Payload() data: any) {
    try {
      const { payload } = data;
      const comments = await this.homeService.getCommentsByPostId(payload.postId);
      return { success: true, data: comments };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.post.like' })
  async handleLikePost(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      const reaction = await this.socialService.likePost(payload.postId, userId, payload.type);
      return { success: true, data: reaction };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.post.comment' })
  async handleAddComment(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      const comment = await this.socialService.addComment(payload.postId, userId, payload.content);
      return { success: true, data: comment };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.user.follow' })
  async handleFollowUser(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      const res = await this.socialService.followUser(userId, payload.targetId);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.user.unfollow' })
  async handleUnfollowUser(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      await this.socialService.unfollowUser(userId, payload.targetId);
      return { success: true, message: 'Unfollowed' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.notification.list' })
  async handleListNotifications(@Payload() data: any) {
    try {
      const { userId } = data;
      const notifications = await this.socialService.getNotifications(userId);
      return { success: true, data: notifications };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.notification.read' })
  async handleMarkNotificationRead(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      await this.socialService.markNotificationRead(userId, payload.notificationId);
      return { success: true, message: 'Marked as read' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.autopost.settings.get' })
  async handleGetAutoPostSettings(@Payload() data: any) {
    try {
      const settings = await this.autoPostService.getSettings();
      return { success: true, data: settings };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.autopost.settings.update' })
  async handleUpdateAutoPostSettings(@Payload() data: any) {
    try {
      const { payload } = data;
      const settings = await this.autoPostService.updateSettings(payload);
      return { success: true, data: settings };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.autopost.run-now' })
  async handleRunAutoPostNow(@Payload() data: any) {
    try {
      const { payload } = data;
      const res = await this.autoPostService.runAutoPost('MANUAL_ADMIN', payload.topic || null, null, false);
      return res;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.news.list' })
  async handleListNews(@Payload() data: any) {
    try {
      const { payload } = data;
      const result = await this.homeService.listNews(
        payload.category || 'NEWS',
        payload.page || 0,
        payload.limit || 10,
        payload.q || ''
      );
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.news.get' })
  async handleGetNewsArticle(@Payload() data: any) {
    try {
      const { payload } = data;
      const article = await this.homeService.getNewsArticle(payload.id);
      return { success: true, data: article };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.news.search' })
  async handleSearchNews(@Payload() data: any) {
    try {
      const { payload } = data;
      const result = await this.homeService.search(payload.q || '');
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.news.create' })
  async handleCreateNews(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      const news = await this.socialService.createNews(userId, payload);
      return { success: true, data: news };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.news.update' })
  async handleUpdateNews(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      const news = await this.socialService.updateNews(userId, payload);
      return { success: true, data: news };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.news.delete' })
  async handleDeleteNews(@Payload() data: any) {
    try {
      const { userId, payload } = data;
      await this.socialService.deleteNews(userId, payload.id);
      return { success: true, message: 'Deleted' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.user.profile.data' })
  async handleGetProfileData(@Payload() data: any) {
    try {
      const { payload } = data;
      const result = await this.homeService.getUserProfileData(payload.userId);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'home.user.media.get' })
  async handleGetUserMedia(@Payload() data: any) {
    try {
      const { payload } = data;
      const result = await this.homeService.getUserMedia(payload.userId);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
