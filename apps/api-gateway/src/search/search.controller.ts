import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectService } from '../project/project.service';
import { HomeService } from '../home/home.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly homeService: HomeService,
  ) {}

  @Get()
  async search(@Query('q') query: string, @Req() req: any) {
    // 1. Search projects
    const projects = await this.projectService.send(
      { cmd: 'project.search' },
      { query, userId: req.user.userId }
    );

    // 2. Search news/posts via Home
    const home = await this.homeService.send(
      { cmd: 'home.news.search' },
      { q: query }
    );

    return {
      success: true,
      data: {
        projects: (projects as any)?.data || [],
        news: (home as any)?.data?.news || [],
        posts: (home as any)?.data?.posts || [],
      }
    };
  }
}
