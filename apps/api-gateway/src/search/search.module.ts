import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { getRabbitMQOptions } from '../config/rabbitmq.config';
import { SearchController } from './search.controller';

@Module({
  imports: [
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
  ],
  controllers: [SearchController],
})
export class SearchModule {}
