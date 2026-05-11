import { Controller, Get, Query, UseGuards, Inject, Logger, Req, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';
import { ElasticsearchInternalService } from './elasticsearch-internal.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
    @Inject('HOME_SERVICE') private readonly homeClient: ClientProxy,
    private readonly elasticSearchService: ElasticsearchInternalService,
  ) {}

  @Get()
  async search(
    @Query('q') q: string, 
    @Query('limit') limit: string,
    @Req() req: any
  ) {
    if (!q) {
      return { projects: [], news: [], posts: [], users: [] };
    }

    const searchLimit = parseInt(limit) || 20;
    const userId = req.user?.userId;

    try {
      // 1. Search Elasticsearch (High performance)
      const esProjects = await this.elasticSearchService.searchProjects(q, searchLimit);
      const esNews = await this.elasticSearchService.searchNews(q, searchLimit);
      const esUsers = await this.elasticSearchService.searchUsers(q, searchLimit);

      this.logger.log(`[ES Search] Query: "${q}" | Projects: ${esProjects.length} | News: ${esNews.length} | Users: ${esUsers.length}`);

      // 2. Fallback / Complement with microservices if needed
      // (Optionally only call these if ES returns nothing or to ensure real-time accuracy)
      
      const [projectResult, homeResult] = await Promise.all([
        firstValueFrom(
          this.projectClient.send({ cmd: 'project.get_all' }, { search: q, page: 1, limit: searchLimit, userId })
        ).catch(() => ({ data: { items: [] } })),
        firstValueFrom(
          this.homeClient.send(
            { cmd: 'home.search.global' },
            { 
              userId: req.user?.userId,
              payload: { q, limit: searchLimit }
            }
          )
        ).catch(() => ({ news: [], posts: [] }))
      ]);

      const projects = this.mergeResults(esProjects, projectResult?.data?.items || projectResult?.items || []);
      const news = this.mergeResults(esNews, homeResult?.news || []);
      const posts = homeResult?.posts || [];

      return {
        projects,
        news,
        posts,
        users: esUsers,
      };
    } catch (error: any) {
      this.logger.error(`[SearchController] search error for "${q}":`, error);
      return { projects: [], news: [], posts: [], users: [], error: error.message };
    }
  }

  private mergeResults(esResults: any[], msResults: any[]) {
    const map = new Map();
    // Add microservice results first (often more up-to-date)
    msResults.forEach(item => map.set(item.id, item));
    // Merge ES results (might have more metadata or better ranking)
    esResults.forEach(item => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }

  @Post('sync')
  async syncAll(@Req() req: any) {
    this.logger.log('Starting manual synchronization to Elasticsearch...');
    const userId = req.user?.userId;

    // 1. Sync Projects
    const projectResult = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.get_all' }, { page: 1, limit: 1000, userId })
    ).catch(() => ({ data: { items: [] } }));
    
    const projects = projectResult?.data?.items || projectResult?.items || [];
    for (const project of projects) {
      await this.elasticSearchService.indexData('projects', project.id, {
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        visibility: project.visibility,
        createdAt: project.createdAt,
      });
    }

    // 2. Sync News
    const homeResult = await firstValueFrom(
      this.homeClient.send({ cmd: 'home.search.global' }, { payload: { q: '', limit: 1000 } })
    ).catch(() => ({ news: [] }));

    const news = homeResult?.news || [];
    for (const article of news) {
      await this.elasticSearchService.indexData('news', article.id || article._id, {
        title: article.title,
        content: article.content,
        authorId: article.authorId,
        createdAt: article.createdAt,
      });
    }

    return {
      success: true,
      synced: {
        projects: projects.length,
        news: news.length,
      }
    };
  }
}

