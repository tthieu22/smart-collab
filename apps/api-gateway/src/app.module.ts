// apps/api-gateway/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientsModule } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { getRabbitMQOptions } from './config/rabbitmq.config';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { UploadModule } from './upload/upload.module';
import { AiModule } from './ai/ai.module';
import { HomeModule } from './home/home.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate limiting (100 req / 60s)
     ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60, limit: 100 }],
    }),

    // JWT strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // RPC client để gọi sang Auth service
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getRabbitMQOptions('auth_queue', configService),
      },
    ]),
    
    ClientsModule.registerAsync([
      {
        name: 'PROJECT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getRabbitMQOptions('project_queue', configService),
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'AI_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getRabbitMQOptions('ai_queue', configService),
      },
    ]),
    // Import các module controller của Gateway
    AuthModule,
    ProjectModule,
    AiModule,
    HomeModule,
    // Upload moudle
    UploadModule,
  ],
})
export class AppModule {}
