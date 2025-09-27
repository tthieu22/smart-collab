import { Module } from '@nestjs/common';
import { AuthMessageHandler } from './auth.message-handler';
import { UserModule } from '../modules/user/user.module';
import { OtcModule } from '../modules/otc/otc.module';
import { AuthModule as AuthServiceModule } from '../modules/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { RedisModule } from '@nestjs-modules/ioredis';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisConfig } from '../config/redis.config';
import { mailerConfig } from '../config/mailer.config';

@Module({
  imports: [
    PrismaModule,

    // Mailer
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => mailerConfig(configService),
    }),

    // Redis
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => redisConfig(configService),
    }),

    // Business modules
    AuthServiceModule,
    UserModule,
    OtcModule,
  ],
  controllers: [AuthMessageHandler],
  // exports: [AuthMessageHandler],
})
export class MessageHandlersModule {}
