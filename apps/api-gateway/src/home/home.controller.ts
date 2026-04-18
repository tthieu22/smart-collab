import { Controller, Get, Post, Patch, Body, Req, UseGuards, Param, Inject } from '@nestjs/common';
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
}
