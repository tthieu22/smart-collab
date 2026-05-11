import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    try {
      const exists = await this.elasticsearchService.indices.exists({ index: 'projects' });
      if (!exists) {
        await this.elasticsearchService.indices.create({ index: 'projects' });
        this.logger.log('Index "projects" created in Elasticsearch.');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch index "projects":', error);
    }
  }

  async indexProject(project: any) {
    try {
      await this.elasticsearchService.index({
        index: 'projects',
        id: project.id,
        body: {
          name: project.name,
          description: project.description,
          ownerId: project.ownerId,
          visibility: project.visibility,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      });
      this.logger.log(`Project indexed: ${project.id}`);
    } catch (error) {
      this.logger.error(`Error indexing project ${project.id}:`, error);
    }
  }

  async removeProject(projectId: string) {
    try {
      await this.elasticsearchService.delete({
        index: 'projects',
        id: projectId,
      });
      this.logger.log(`Project removed from index: ${projectId}`);
    } catch (error) {
      this.logger.error(`Error removing project ${projectId} from index:`, error);
    }
  }
}
