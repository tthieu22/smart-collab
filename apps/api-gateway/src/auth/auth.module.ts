import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from './internal/config/mailer.config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookieService } from '../services/auth/cookie.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

// Internal implementations
import { AuthService as InternalAuthService } from './internal/modules/auth/auth.service';
import { UserService as InternalUserService } from './internal/modules/user/user.service';
import { OtcService as InternalOtcService } from './internal/modules/otc/otc.store';
import { AuthMessageHandler } from './internal/message-handlers/auth.message-handler';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES') || '1d',
        },
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => mailerConfig(configService),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    CookieService, 
    JwtStrategy, 
    GoogleStrategy,
    // Internal implementations
    InternalAuthService,
    InternalUserService,
    InternalOtcService,
    AuthMessageHandler,
  ],
  exports: [
    AuthService, 
    InternalAuthService, 
    InternalUserService, 
    PassportModule, 
    JwtModule, 
    JwtStrategy
  ],
})
export class AuthModule {}
