import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from './realtime.gateway';
import { getGolevelupRabbitMQOptions } from './config/rabbitmq.config';
import { ProjectRealtimeConsumer } from './project/project.consumer';
import { MemberRealtimeConsumer } from './project/member.consumer';

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
  providers: [
    RealtimeGateway, 
    ProjectRealtimeConsumer,
    MemberRealtimeConsumer
  ],
})
export class RealtimeModule {}
