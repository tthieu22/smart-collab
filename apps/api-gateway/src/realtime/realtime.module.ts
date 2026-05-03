import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import Redis from 'ioredis';

import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { getGolevelupRabbitMQOptions, getNestRabbitMQOptions } from './config/rabbitmq.config';
import { redisConfig } from './config/redis.config';

import { RealtimeGateway } from './realtime.gateway';
import { ClientsModule } from '@nestjs/microservices';
import { LockService } from './services/lock.service';
import { CardService } from './services/project/card.service';
import { ColumnService } from './services/project/column.service';
import { BoardService } from './services/project/board.service';
import { MemberService } from './services/project/member.service';
import { MeetingService } from './services/project/meeting.service';
import { NotificationConsumer } from './services/notification.consumer';
import { ProjectConsumer } from './services/project.consumer';

@Module({
  imports: [
    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: 'PROJECT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) =>
          getNestRabbitMQOptions('project_queue', config),
      },
    ]),
  ],
  providers: [
    RealtimeGateway,
    LockService,
    BoardService,
    CardService,
    ColumnService,
    MemberService,
    MeetingService,
    NotificationConsumer,
    ProjectConsumer,
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const { options } = redisConfig(config);
        const client = new Redis(options);

        client.on('connect', () => console.log('Redis connected'));
        client.on('error', (err) => console.error('Redis error', err));

        const shutdown = async () => {
          console.log('Closing Redis...');
          await client.quit();
          process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT', RealtimeGateway, LockService],
})
export class RealtimeModule {}