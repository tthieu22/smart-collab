import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { HomeMessageHandler } from './internal/message-handlers/home.message-handler';

@Injectable()
export class HomeService {
  constructor(
    @Inject(forwardRef(() => HomeMessageHandler))
    private readonly handler: HomeMessageHandler
  ) {}

  async send(pattern: { cmd: string }, payload: any) {
    const { cmd } = pattern;
    switch (cmd) {
      case 'home.feed.get': return this.handler.handleGetFeed(payload);
      case 'home.post.create': return this.handler.handleCreatePost(payload);
      case 'home.post.get': return this.handler.handleGetPost(payload);
      case 'home.post.comments.get': return this.handler.handleGetComments(payload);
      case 'home.post.like': return this.handler.handleLikePost(payload);
      case 'home.post.comment': return this.handler.handleAddComment(payload);
      case 'home.user.follow': return this.handler.handleFollowUser(payload);
      case 'home.user.unfollow': return this.handler.handleUnfollowUser(payload);
      case 'home.user.mood.update': return this.handler.handleUpdateUserMood(payload);
      case 'home.notification.list': return this.handler.handleListNotifications(payload);
      case 'home.notification.read': return this.handler.handleMarkNotificationRead(payload);
      case 'home.autopost.settings.get': return this.handler.handleGetAutoPostSettings(payload);
      case 'home.autopost.settings.update': return this.handler.handleUpdateAutoPostSettings(payload);
      case 'home.autopost.run-now': return this.handler.handleRunAutoPostNow(payload);
      case 'home.news.list': return this.handler.handleListNews(payload);
      case 'home.news.get': return this.handler.handleGetNewsArticle(payload);
      case 'home.news.search': return this.handler.handleSearchNews(payload);
      case 'home.news.create': return this.handler.handleCreateNews(payload);
      case 'home.news.update': return this.handler.handleUpdateNews(payload);
      case 'home.news.delete': return this.handler.handleDeleteNews(payload);
      case 'home.user.profile.data': return this.handler.handleGetProfileData(payload);
      case 'home.user.media.get': return this.handler.handleGetUserMedia(payload);
      default:
        throw new Error(`Unhandled home command: ${cmd}`);
    }
  }
}
