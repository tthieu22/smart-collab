import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from '../modules/auth/auth.service';
import { UserService } from '../modules/user/user.service';
import { OtcService } from '../modules/otc/otc.store';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

import {
  LoginMessageDto,
  RegisterMessageDto,
  RefreshMessageDto,
  LogoutMessageDto,
  LogoutAllMessageDto,
  GetUserMessageDto,
  ValidateUserMessageDto,
  VerifyEmailMessageDto,
  AuthResponseDto,
  LoginResponseDto,
  RegisterResponseDto,
  RefreshResponseDto,
  UserResponseDto,
} from './dto/auth-message.dto';

interface UserWithPassword {
  id: string;
  email: string;
  password: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  googleId: string | null;
  role: string;
  isVerified: boolean;
  emailVerificationCode: string | null;
  emailVerificationCodeExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Controller()
export class AuthMessageHandler {
  private readonly logger = new Logger(AuthMessageHandler.name);
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly otcService: OtcService,
  ) {}

  @MessagePattern({cmd:'auth.login'})
  async handleLogin(
    @Payload() loginDto: LoginMessageDto,
  ): Promise<LoginResponseDto> {
    try {
      const user = (await this.userService.findByEmail(
        loginDto.email,
      )) as UserWithPassword;

      if (
        !user ||
        !(await bcrypt.compare(loginDto.password || '', user.password || ''))
      ) {
        return {
          success: false,
          message: 'Thông tin tài khoản không chính xác',
        };
      }

      if (!user.isVerified) {
        return {
          success: false,
          message: 'Email chưa được xác thực',
          data: { needsVerified: true },
        };
      }

      if (!user.password) {
        return {
          success: false,
          message: 'Yêu cầu tạo mật khẩu',
          data: {
            needsPassword: true,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar,
              role: user.role,
            },
          },
        };
      }

      const sessionId = randomBytes(16).toString('hex');
      const context: Partial<{ device: string; ua: string; ip: string }> = {
        device: sessionId,
        ua: 'microservice',
      };

      const tokens = await this.authService.issueTokensForUser(
        { id: user.id, email: user.email, role: user.role },
        context,
      );

      return {
        success: true,
        message: 'Login successful',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            role: user.role,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  @MessagePattern({cmd: 'auth.register'})
  async handleRegister(
    @Payload() registerDto: RegisterMessageDto,
  ): Promise<RegisterResponseDto> {
    try {
      const existing = await this.userService.findByEmail(registerDto.email);
      if (existing) {
        return {
          success: false,
          message: 'Email đã được sử dụng',
        };
      }

      const newUser = await this.userService.create({
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName ?? null,
        lastName: registerDto.lastName ?? null,
        role: 'USER',
      });

      return {
        success: true,
        message: 'Đăng ký thành công, vui lòng xác thực email',
        data: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          isVerified: newUser.isVerified,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Đăng ký thất bại',
      };
    }
  }

  @MessagePattern({cmd:'auth.refresh'})
  async handleRefresh(
    @Payload() refreshDto: RefreshMessageDto,
  ): Promise<RefreshResponseDto> {
    try {
      console.log("refreshDto.refreshToken",refreshDto.refreshToken)
      const payload = await this.authService.validateRefreshToken(
        refreshDto.refreshToken,
      );
      if (!payload?.userId) {
        return {
          success: false,
          message: 'Invalid refresh token',
        };
      }

      const sessionId = randomBytes(16).toString('hex');
      const context: Partial<{ device: string; ua: string; ip: string }> = {
        device: sessionId,
        ua: 'microservice',
      };

      const tokens = await this.authService.rotateRefreshToken(
        payload.userId,
        refreshDto.refreshToken,
        context,
      );

      if (!tokens) {
        return {
          success: false,
          message: 'Failed to refresh token',
        };
      }

      return {
        success: true,
        message: 'Refreshed',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Token refresh failed',
      };
    }
  }

  @MessagePattern({cmd:'auth.logout'})
  async handleLogout(
    @Payload() logoutDto: LogoutMessageDto,
  ): Promise<AuthResponseDto> {
    try {
      if (logoutDto.refreshToken) {
        await this.authService.rotateRefreshToken(
          '',
          logoutDto.refreshToken,
          undefined,
          {
            revokeOnly: true,
          },
        );
      }

      return {
        success: true,
        message: 'Logged out',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Logout failed',
      };
    }
  }

  @MessagePattern({cmd:'auth.logoutAll'})
  async handleLogoutAll(
    @Payload() logoutAllDto: LogoutAllMessageDto,
  ): Promise<AuthResponseDto> {
    try {
      await this.authService.logoutAllDevices(logoutAllDto.userId);
      return {
        success: true,
        message: 'Logged out from all devices',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Logout all failed',
      };
    }
  }

  @MessagePattern({cmd:'auth.me'})
  async handleGetCurrentUser(
    @Payload() getUserDto: GetUserMessageDto,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userService.findOne(getUserDto.userId);
      return {
        success: true,
        message: 'OK',
        data: user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'User not found',
      };
    }
  }

  @MessagePattern({cmd:'auth.validateUser'})
  async handleValidateUser(
    @Payload() validateDto: ValidateUserMessageDto,
  ): Promise<UserResponseDto> {
    try {
      const user = (await this.userService.findByEmail(
        validateDto.email,
      )) as UserWithPassword;

      if (
        !user ||
        !(await bcrypt.compare(validateDto.password || '', user.password || ''))
      ) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      if (!user.isVerified) {
        return {
          success: false,
          message: 'Email not verified',
        };
      }

      const { password, ...safeUser } = user;
      return {
        success: true,
        message: 'User validated successfully',
        data: safeUser,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Validation failed',
      };
    }
  }

  @MessagePattern({cmd:'auth.verifyEmail'})
  async handleVerifyEmail(
    @Payload() verifyDto: VerifyEmailMessageDto,
  ): Promise<AuthResponseDto> {
    try {
      const isVerified = await this.userService.verifyEmail(
        verifyDto.email,
        verifyDto.code,
      );
      return isVerified
        ? { success: true, message: 'Email verified successfully' }
        : { success: false, message: 'Invalid or expired verification code' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Email verification failed',
      };
    }
  }
  @MessagePattern({ cmd: 'auth.upsertGoogleUser' })
  async handleUpsertGoogleUser(@Payload() payload: any) {
    try {
      const user = await this.authService.upsertGoogleUser(payload);
      return { success: true, message: 'OK', data: user };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message || 'Upsert failed' };
    }
  }

  @MessagePattern({ cmd: 'auth.generateOAuthCode' })
  async handleGenerateOAuthCode(@Payload() payload: { userId: string; email: string; role?: string }) {
    try {
      const res = await this.authService.generateOAuthCode(payload);
      return { success: true, message: 'OK', data: { code: res.code } };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message || 'Generate code failed' };
    }
  }

  @MessagePattern({ cmd: 'auth.oauthExchange' })
  async handleOAuthExchange(@Payload() payload: { code: string }) {
    try {
      const result = await this.authService.exchangeOAuthCode(payload.code);
      if (!result) return { success: false, message: 'Invalid or expired code' };
      return { success: true, message: 'OK', data: result };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message || 'Exchange failed' };
    }
  }
}
