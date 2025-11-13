import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ProjectController } from './project.controller';
import { getGolevelupRabbitMQOptions, getRabbitMQOptions } from '../config/rabbitmq.config';
import { ClientsModule } from '@nestjs/microservices';
import { CardController } from './column/card.cotroller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getGolevelupRabbitMQOptions(configService),
    }),
    ClientsModule.registerAsync([
      {
        name: 'PROJECT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getRabbitMQOptions('project_queue', configService),
      },
    ]),
  ],
  controllers: [ProjectController, CardController],
})
export class ProjectModule {}
