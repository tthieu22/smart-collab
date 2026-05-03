import { Controller, Post, Patch, Body, Param, Query, Get, UseGuards, Req } from '@nestjs/common';
import { SocialService } from '../services/social.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('home')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Patch('/user/mood')
  @UseGuards(JwtAuthGuard)
  async updateMood(@Body() payload: { mood: string }, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    return this.socialService.updateMood(userId, payload.mood);
  }

  @Post('/post')
  @UseGuards(JwtAuthGuard)
  async createPost(@Body() data: any, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    return this.socialService.createPost(userId, data);
  }

  @Get('/post/:id')
  @UseGuards(JwtAuthGuard)
  async getPost(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    return this.socialService.getPost(id, userId);
  }

  @Post('/post/:id/like')
  @UseGuards(JwtAuthGuard)
  async likePost(@Param('id') id: string, @Body() body: { type: string }, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    const type = body.type || 'LIKE';
    return this.socialService.likePost(id, userId, type);
  }

  @Post('/post/:id/comment')
  @UseGuards(JwtAuthGuard)
  async addComment(@Param('id') id: string, @Body() body: { content: string }, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    return this.socialService.addComment(id, userId, body.content);
  }

  @Get('/post/:id/comments')
  async getComments(@Param('id') id: string) {
    return this.socialService.getComments(id);
  }

  @Post('/post/:id/share')
  @UseGuards(JwtAuthGuard)
  async sharePost(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    return this.socialService.sharePost(id, userId);
  }

  @Post('/user/:id/follow')
  @UseGuards(JwtAuthGuard)
  async followUser(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    return this.socialService.followUser(userId, id);
  }

  @Post('/user/:id/unfollow')
  @UseGuards(JwtAuthGuard)
  async unfollowUser(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    return this.socialService.unfollowUser(userId, id);
  }
}
