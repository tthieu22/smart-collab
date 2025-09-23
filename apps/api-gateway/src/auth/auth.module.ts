import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { getRabbitMQOptions } from '../config/rabbitmq.config';
import { CookieService } from '../services/auth/cookie.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  
    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || process.env.JWT_SECRET || 'your-secret-key',
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') || process.env.JWT_EXPIRES_IN || '15m' },
      }),
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
  ],
  controllers: [AuthController],
  providers: [AuthService, CookieService, JwtStrategy, GoogleStrategy], 
  exports: [PassportModule, JwtModule, JwtStrategy], 
})
export class AuthModule {}
