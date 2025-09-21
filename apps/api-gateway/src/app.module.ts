import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientsModule } from '@nestjs/microservices';
import { AuthController } from './controllers/auth.controller';
import { HealthController } from './controllers/health.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthClientService } from './services/auth/auth-client.service';
import { CookieService } from './services/auth/cookie.service';
import appConfig from './config/app.config';
import { createRabbitMQClient } from './config/rabbitmq.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),

    // JWT & Passport
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('jwt.secret') ||
          process.env.JWT_SECRET ||
          'your-secret-key',
        signOptions: {
          expiresIn:
            configService.get<string>('jwt.expiresIn') ||
            process.env.JWT_EXPIRES_IN ||
            '15m',
        },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Microservices clients
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          createRabbitMQClient('auth_queue', configService),
      },
      {
        name: 'PROJECT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          createRabbitMQClient('project_queue', configService),
      },
      {
        name: 'TASK_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          createRabbitMQClient('task_queue', configService),
      },
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          createRabbitMQClient('notification_queue', configService),
      },
      {
        name: 'REALTIME_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          createRabbitMQClient('realtime_queue', configService),
      },
      {
        name: 'AI_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          createRabbitMQClient('ai_queue', configService),
      },
    ]),
  ],
  controllers: [AuthController, HealthController],
  providers: [
    JwtStrategy,
    AuthClientService,
    CookieService,
  ],
})
export class AppModule {}
