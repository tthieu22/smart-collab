import { Controller, Get, Post, Patch, Body, Req, UseGuards, Param, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';

@Controller('home')
export class HomeController {
  constructor(@Inject('HOME_SERVICE') private readonly homeClient: ClientProxy) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async getFeed(@Req() req: any) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.feed.get' }, { userId: req.user.userId })
    );
  }

  @Post('post')
  @UseGuards(JwtAuthGuard)
  async createPost(@Body() body: any, @Req() req: any) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.post.create' }, { 
        userId: req.user.userId,
        payload: body 
      })
    );
  }

  @Post('post/:id/like')
  @UseGuards(JwtAuthGuard)
  async likePost(@Param('id') postId: string, @Body('type') type: string, @Req() req: any) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.post.like' }, { 
        userId: req.user.userId,
        payload: { postId, type } 
      })
    );
  }

  @Post('post/:id/comment')
  @UseGuards(JwtAuthGuard)
  async addComment(@Param('id') postId: string, @Body('content') content: string, @Req() req: any) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.post.comment' }, { 
        userId: req.user.userId,
        payload: { postId, content } 
      })
    );
  }

  @Post('user/:id/follow')
  @UseGuards(JwtAuthGuard)
  async followUser(@Param('id') targetId: string, @Req() req: any) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.user.follow' }, { 
        userId: req.user.userId,
        payload: { targetId } 
      })
    );
  }

  @Post('user/:id/unfollow')
  @UseGuards(JwtAuthGuard)
  async unfollowUser(@Param('id') targetId: string, @Req() req: any) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.user.unfollow' }, { 
        userId: req.user.userId,
        payload: { targetId } 
      })
    );
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async getNotifications(@Req() req: any) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.notification.list' }, {
        userId: req.user.userId,
      })
    );
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  async markNotificationRead(@Param('id') notificationId: string, @Req() req: any) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.notification.read' }, {
        userId: req.user.userId,
        payload: { notificationId },
      })
    );
  }

  @Get('admin/auto-post/settings')
  @UseGuards(JwtAuthGuard)
  async getAutoPostSettings() {
    return firstValueFrom(this.homeClient.send({ cmd: 'home.autopost.settings.get' }, {}));
  }

  @Patch('admin/auto-post/settings')
  @UseGuards(JwtAuthGuard)
  async updateAutoPostSettings(@Body() body: any) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.autopost.settings.update' }, { payload: body }),
    );
  }

  @Post('admin/auto-post/run-now')
  @UseGuards(JwtAuthGuard)
  async runAutoPostNow(@Body() body: { topic?: string }) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.autopost.run-now' }, { payload: body ?? {} }),
    );
  }

  @Get('admin/news')
  @UseGuards(JwtAuthGuard)
  async listNewsAdmin(@Query('category') category?: string) {
    const payload =
      category != null && String(category).trim() !== ''
        ? { category: String(category).trim().toUpperCase() }
        : {};
    return firstValueFrom(this.homeClient.send({ cmd: 'home.news.list' }, { payload }));
  }

  @Get('news/:id')
  @UseGuards(JwtAuthGuard)
  async getNewsArticle(@Param('id') id: string) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.news.get' }, { payload: { id } }),
    );
  }

  @Get('news')
  @UseGuards(JwtAuthGuard)
  async listNewsForUser(@Query('category') category?: string) {
    const cat = (category?.trim() || 'NEWS').toUpperCase();
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.news.list' }, { payload: { category: cat } }),
    );
  }

  @Post('admin/news')
  @UseGuards(JwtAuthGuard)
  async createNews(
    @Body() body: { content: string; media?: any[]; category?: string; linkUrl?: string | null },
    @Req() req: any,
  ) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.news.create' }, {
        userId: req.user.userId,
        payload: body,
      }),
    );
  }

  @Patch('admin/news/:id')
  @UseGuards(JwtAuthGuard)
  async updateNews(
    @Param('id') id: string,
    @Body() body: { content?: string; category?: string; linkUrl?: string | null; media?: any[] },
    @Req() req: any,
  ) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.news.update' }, {
        userId: req.user.userId,
        payload: { id, ...body },
      }),
    );
  }

  @Post('admin/news/:id/delete')
  @UseGuards(JwtAuthGuard)
  async deleteNews(@Param('id') id: string, @Req() req: any) {
    return firstValueFrom(
      this.homeClient.send({ cmd: 'home.news.delete' }, {
        userId: req.user.userId,
        payload: { id },
      }),
    );
  }
}
