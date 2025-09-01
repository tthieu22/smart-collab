import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { OtcModule } from './modules/otc/otc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
          port: configService.get<number>('SMTP_PORT') ?? 587,
          secure: false,
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('SMTP_FROM') ?? 'noreply@authnexus.com',
        },
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const options: any = {
          host: configService.get<string>('REDIS_HOST') ?? '127.0.0.1',
          port: configService.get<number>('REDIS_PORT') ?? 6379,
        };

        const username = configService.get<string>('REDIS_USERNAME');
        const password = configService.get<string>('REDIS_PASSWORD');
        const db = configService.get<number>('REDIS_DB');

        if (username) options.username = username;
        if (password) options.password = password;
        if (db !== undefined) options.db = db;

        return {
          type: 'single' as const,
          options: options,
        };
      },
    }),
    UserModule,
    AuthModule,
    OtcModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
