import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ProjectController } from './project.controller';
import { getGolevelupRabbitMQOptions, getRabbitMQOptions } from '../config/rabbitmq.config';
import { ClientsModule } from '@nestjs/microservices';
import { CardController } from './column/card.cotroller';
import { ColumnController } from './column/column.controller';

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
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getRabbitMQOptions('auth_queue', configService),
      },
    ]),
  ],
  controllers: [ProjectController, CardController, ColumnController],
})
export class ProjectModule {}
