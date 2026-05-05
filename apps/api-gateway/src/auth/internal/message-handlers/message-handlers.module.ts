import { Module } from '@nestjs/common';
import { AuthMessageHandler } from './auth.message-handler';
import { UserModule } from '../modules/user/user.module';
import { OtcModule } from '../modules/otc/otc.module';
import { AuthModule as AuthServiceModule } from '../modules/auth/auth.module';
import { HomeModule } from '../modules/home/home.module';
import { HomeMessageHandler } from './home.message-handler';
import { MailerModule } from '@nestjs-modules/mailer';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

