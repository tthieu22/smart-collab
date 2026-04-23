import { Controller, Get, Query, UseGuards, Inject, Logger, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
    @Inject('HOME_SERVICE') private readonly homeClient: ClientProxy,
  ) {}

  @Get()
  async search(@Query('q') q: string, @Req() req: any) {
    if (!q) {
      return { projects: [], news: [], posts: [] };
    }

    const userId = req.user?.userId;

    try {
      // 1. Search Projects
      const projectResult: any = await firstValueFrom(
        this.projectClient.send({ cmd: 'project.get_all' }, { search: q, page: 1, limit: 5, userId })
      );

      // 2. Search News & Posts (Calling Java service)
      const homeResult: any = await firstValueFrom(
        this.homeClient.send(
          { cmd: 'home.search.global' },
          { 
            userId: req.user?.userId,
            payload: { q }
          }
        )
      );

      this.logger.log(`Project Result: ${JSON.stringify(projectResult)}`);
      this.logger.log(`Home Result: ${JSON.stringify(homeResult)}`);
      this.logger.log(`[Search] Query: "${q}" | Projects found: ${projectResult?.data?.items?.length || 0} | News found: ${homeResult?.news?.length || 0} | Posts found: ${homeResult?.posts?.length || 0}`);

      return {
        // Project service returns { success, data: { items, total } }
        projects: projectResult?.data?.items || projectResult?.items || [],
        // Home service (Java) returns Map.of("news", list, "posts", list)
        news: homeResult?.news || [],
        posts: homeResult?.posts || [],
      };
    } catch (error: any) {
      this.logger.error(`[SearchController] search error for "${q}":`, error);
      return { projects: [], news: [], posts: [], error: error.message };
    }
  }
}
