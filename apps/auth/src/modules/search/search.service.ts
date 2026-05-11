import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    try {
      const exists = await this.elasticsearchService.indices.exists({ index: 'users' });
      if (!exists) {
        await this.elasticsearchService.indices.create({ index: 'users' });
        this.logger.log('Index "users" created in Elasticsearch.');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch index "users":', error);
    }
  }

  async indexUser(user: any) {
    try {
      await this.elasticsearchService.index({
        index: 'users',
        id: user.id,
        body: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          role: user.role,
          updatedAt: user.updatedAt,
        },
      });
      this.logger.log(`User indexed: ${user.id}`);
    } catch (error) {
      this.logger.error(`Error indexing user ${user.id}:`, error);
    }
  }

  async removeUser(userId: string) {
    try {
      await this.elasticsearchService.delete({
        index: 'users',
        id: userId,
      });
      this.logger.log(`User removed from index: ${userId}`);
    } catch (error) {
      this.logger.error(`Error removing user ${userId} from index:`, error);
    }
  }
}
