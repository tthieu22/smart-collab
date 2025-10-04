import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { getGolevelupRabbitMQOptions } from './config/rabbitmq.config';
import { ProjectRealtimeConsumer } from './project/project.consumer';
import { MemberRealtimeConsumer } from './project/member.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // RabbitMQ setup
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getGolevelupRabbitMQOptions(configService),
    }),

    // JWT setup
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [
    RealtimeGateway,
    ProjectRealtimeConsumer,
    MemberRealtimeConsumer,
  ],
})
export class RealtimeModule {}
