import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AiController } from './ai.controller';
import { getGolevelupRabbitMQOptions, getRabbitMQOptions } from '../config/rabbitmq.config';
import { ClientsModule } from '@nestjs/microservices';

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
        name: 'AI_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getRabbitMQOptions('ai_queue', configService),
      },
    ]),
  ],
  controllers: [AiController],
})
export class AiModule {}
