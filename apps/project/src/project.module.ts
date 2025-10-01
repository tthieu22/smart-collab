import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ProjectConsumer } from './project.consumer';
import { getGolevelupRabbitMQOptions } from './config/rabbitmq.config';
import { ProjectService } from './project.service';
import { PrismaModule } from '../prisma/project.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getGolevelupRabbitMQOptions(configService),
    }),
  ],
  providers: [ProjectConsumer, ProjectService],
})
export class ProjectModule {}
