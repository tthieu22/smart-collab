import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { getRabbitMQOptions } from '../config/rabbitmq.config';
import { SearchController } from './search.controller';
import { ElasticsearchInternalService } from './elasticsearch-internal.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'PROJECT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getRabbitMQOptions('project_queue', configService),
      },
      {
        name: 'HOME_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getRabbitMQOptions('home_requests_queue', configService),
      },
    ]),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get<string>('ELASTICSEARCH_NODE'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SearchController],
  providers: [ElasticsearchInternalService],
  exports: [ElasticsearchInternalService],
})
export class SearchModule {}

