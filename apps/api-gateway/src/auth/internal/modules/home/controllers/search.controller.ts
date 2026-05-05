import { Controller, Get, Query } from '@nestjs/common';
import { HomeService } from '../services/home.service';

@Controller('v1/search')
export class SearchController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  async search(@Query('q') query: string) {
    return this.homeService.search(query);
  }
}
