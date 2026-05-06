import { Controller, Get, UseGuards, Req, Param, Patch, Body, Query, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getCurrentUser({ userId: req.user.userId });
  }

  @Get('suggestions')
  async getSuggestions(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.authService.getSuggestions({
      userId: req.user.userId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 5,
      type,
    });
  }

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() data: any) {
    return this.authService.updateProfile({ userId: req.user.userId, data });
  }

  @Get()
  async searchUsers(@Query('q') q: string) {
    return this.authService.searchUsers({ q });
  }

  @Post('check-emails')
  async checkEmails(@Body('emails') emails: string[]) {
    return this.authService.checkEmails({ emails });
  }

  @Post('follow/:id')
  async followUser(@Req() req: any, @Param('id') followingId: string) {
    const followerId = req.user.userId;
    return this.authService.toggleFollow({ followerId, followingId });
  }

  @Get('profile/:id/relation')
  async getProfileRelation(@Req() req: any, @Param('id') targetId: string) {
    const observerId = req.user.userId;
    return this.authService.getFollowRelation({ targetId, observerId });
  }

  @Get(':id')
  async getUser(@Param('id') userId: string) {
    return this.authService.getCurrentUser({ userId });
  }
}
