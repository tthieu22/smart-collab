import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeConsumer } from './realtime.consumer';
import { getGolevelupRabbitMQOptions } from './config/rabbitmq.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getGolevelupRabbitMQOptions(configService),
    }),
  ],
  providers: [RealtimeGateway, RealtimeConsumer],
})
export class RealtimeModule {}
