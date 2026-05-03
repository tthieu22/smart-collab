import { Module } from '@nestjs/common';
import { AuthMessageHandler } from './auth.message-handler';
import { UserModule } from '../modules/user/user.module';
import { OtcModule } from '../modules/otc/otc.module';
import { AuthModule as AuthServiceModule } from '../modules/auth/auth.module';
import { HomeModule } from '../modules/home/home.module';
import { HomeMessageHandler } from './home.message-handler';
import { MailerModule } from '@nestjs-modules/mailer';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AuthPrismaModule } from '../../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisConfig } from '../config/redis.config';
import { mailerConfig } from '../config/mailer.config';

@Module({
  imports: [
    AuthPrismaModule,

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
    HomeModule,
  ],
  controllers: [AuthMessageHandler, HomeMessageHandler],
  // exports: [AuthMessageHandler],
})
export class MessageHandlersModule {}

