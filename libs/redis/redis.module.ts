import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule as IORedisModule } from '@nestjs-modules/ioredis';
import { redisConfig } from './redis.config';

@Global()
@Module({
  imports: [
    ConfigModule,
    IORedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => redisConfig(configService),
    }),
  ],
  exports: [IORedisModule],
})
export class RedisModule {}
