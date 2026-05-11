import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class ElasticsearchInternalService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchInternalService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    try {
      const indices = ['projects', 'users', 'news'];
      for (const index of indices) {
        const exists = await this.elasticsearchService.indices.exists({ index });
        if (!exists) {
          await this.elasticsearchService.indices.create({ index });
          this.logger.log(`Index "${index}" created in Elasticsearch.`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch indices:', error);
    }
  }

  async searchProjects(q: string, limit: number = 20) {
    if (!q) return [];
    try {
      const result = await this.elasticsearchService.search({
        index: 'projects',
        size: limit,
        query: {
          multi_match: {
            query: q,
            fields: ['name^3', 'description'],
            fuzziness: 'AUTO',
          },
        },
      });
      return (result as any).hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      }));
    } catch (error) {
      this.logger.error('Search projects error:', error);
      return [];
    }
  }

  async searchUsers(q: string, limit: number = 20) {
    if (!q) return [];
    try {
      const result = await this.elasticsearchService.search({
        index: 'users',
        size: limit,
        query: {
          multi_match: {
            query: q,
            fields: ['firstName^2', 'lastName^2', 'email'],
            fuzziness: 'AUTO',
          },
        },
      });
      return (result as any).hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      }));
    } catch (error) {
      this.logger.error('Search users error:', error);
      return [];
    }
  }

  async searchNews(q: string, limit: number = 20) {
    if (!q) return [];
    try {
      const result = await this.elasticsearchService.search({
        index: 'news',
        size: limit,
        query: {
          multi_match: {
            query: q,
            fields: ['title^3', 'content'],
            fuzziness: 'AUTO',
          },
        },
      });
      return (result as any).hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      }));
    } catch (error) {
      this.logger.error('Search news error:', error);
      return [];
    }
  }

  async indexData(index: string, id: string, data: any) {
    try {
      await this.elasticsearchService.index({
        index,
        id,
        body: data,
      });
    } catch (error) {
      this.logger.error(`Indexing error for index "${index}":`, error);
    }
  }
}
