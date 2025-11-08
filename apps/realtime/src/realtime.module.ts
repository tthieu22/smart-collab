// realtime.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { getGolevelupRabbitMQOptions } from './config/rabbitmq.config';
import { ProjectRealtimeConsumer } from './project/project.consumer';
import { MemberRealtimeConsumer } from './project/member.consumer';
import Redis from 'ioredis';
import { redisConfig } from './config/redis.config';
import { BoardService } from './services/board.service';
import { ColumnService } from './services/column.service';
import { CardService } from './services/card.service';
import { EmitService } from './services/emit.service';
import { LockService } from './services/lock.service';
import { ColumnConsumer } from './project/column.consumer';
import { CardConsumer } from './project/card.consumer';

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
    ColumnConsumer,
    CardConsumer,
    BoardService,
    ColumnService,
    CardService,
    EmitService,
    LockService,

    // Redis client provider
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisOptions = redisConfig(configService).options;
        const client = new Redis(redisOptions);
        client.on('connect', () => console.log('✅ Redis connected'));
        client.on('error', (err: any) => console.error('❌ Redis error', err));
        const shutdown = async () => {
          console.log('🧹 Closing Redis connection...');
          await client.quit();
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RealtimeModule {}
