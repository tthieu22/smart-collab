// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientsModule } from '@nestjs/microservices';
import { getRabbitMQOptions } from './config/rabbitmq.config';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      // load: [appConfig],
    }),
    // ThrottlerModule (Rate limiting)
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60, // 60 giây
          limit: 100, // 100 requests
        },
      ],
    }),
    
    PassportModule.register({ defaultStrategy: 'jwt' }),

    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getRabbitMQOptions('auth_queue', configService),
      },
    ]),

    AuthModule,
  ],
})
export class AppModule {}
