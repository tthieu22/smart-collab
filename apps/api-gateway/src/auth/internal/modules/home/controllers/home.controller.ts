import { Controller, Get, Query, Headers, UseGuards, Req } from '@nestjs/common';
import { HomeService } from '../services/home.service';
import { SocialService } from '../services/social.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('home/feed')
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    private readonly socialService: SocialService,
  ) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @Req() req: Request,
    @Query('page') page = 0,
    @Query('limit') limit = 10,
    @Query('excludeIds') excludeIds?: string | string[],
  ) {
    const userId = (req.user as any)?.userId || 'u_me';
    let excludes: string[] = [];
    if (excludeIds) {
      if (Array.isArray(excludeIds)) {
        excludes = excludeIds;
      } else {
        excludes = excludeIds.split(',').filter(id => id.trim().length > 0);
      }
    }
    return this.homeService.getFeed(userId, Number(page), Number(limit), excludes);
  }
}
