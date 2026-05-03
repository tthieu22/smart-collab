import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AutoPostService } from '../services/auto-post.service';

@Controller('v1/autopost')
export class AutoPostController {
  constructor(private readonly autoPostService: AutoPostService) {}

  @Get('/settings')
  async getSettings() {
    return this.autoPostService.getSettings();
  }

  @Post('/settings')
  async updateSettings(@Body() payload: any) {
    return this.autoPostService.updateSettings(payload);
  }

  @Post('/run')
  async runNow(
    @Query('source') source = 'MANUAL_ADMIN',
    @Query('topic') topic?: string,
    @Query('eventKey') eventKey?: string,
  ) {
    return this.autoPostService.runAutoPost(source, topic || null, eventKey || null, false);
  }
}
