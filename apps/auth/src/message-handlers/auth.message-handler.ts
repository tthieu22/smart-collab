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

      // Increment login count and log action
      await this.userService.incrementLoginCount(user.id);
      await this.userService.createLog(user.id, 'LOGIN', `Logged in via ${context.ua || 'unknown'}`);

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



  @MessagePattern({ cmd: 'auth.me' })
  async handleGetCurrentUser(
    @Payload() data: { userId: string },
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userService.findOne(data.userId);
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
      const res = await this.authService.exchangeOAuthCode(payload.code);
      if (!res) return { success: false, message: 'Invalid or expired code' };
      return { success: true, message: 'OK', data: res };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message || 'Exchange failed' };
    }
  }

  @MessagePattern({ cmd: 'auth.searchUsers' })
  async handleSearchUsers(@Payload() payload: { query: string }) {
    try {
      const users = await this.userService.search(payload.query);
      // Map to include a full name for easier display
      const mappedUsers = users.map(u => ({
        ...u,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
      }));
      return { success: true, data: mappedUsers };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message || 'Search failed' };
    }
  }

  @MessagePattern({ cmd: 'auth.updateProfile' })
  async handleUpdateProfile(@Payload() payload: { userId: string; data: any }) {
    try {
      const updatedUser = await this.userService.update(payload.userId, payload.data);
      return { success: true, message: 'Cập nhật thông tin thành công', data: updatedUser };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message || 'Cập nhật thất bại' };
    }
  }

  @MessagePattern({ cmd: 'auth.changePassword' })
  async handleChangePassword(@Payload() payload: { userId: string; data: any }) {
    try {
      await this.userService.changePassword(payload.userId, payload.data);
      return { success: true, message: 'Đổi mật khẩu thành công' };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message || 'Đổi mật khẩu thất bại' };
    }
  }

  @MessagePattern({ cmd: 'auth.resendCode' })
  async handleResendCode(@Payload() payload: { email: string }) {
    try {
      await this.userService.resendVerificationCode(payload.email);
      return { success: true, message: 'Đã gửi lại mã xác thực' };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message || 'Gửi lại mã thất bại' };
    }
  }

  @MessagePattern({ cmd: 'auth.disconnectGoogle' })
  async handleDisconnectGoogle(@Payload() payload: { userId: string }) {
    try {
      await this.userService.disconnectGoogle(payload.userId);
      return { success: true, message: 'Đã hủy liên kết Google' };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message || 'Hủy liên kết thất bại' };
    }
  }

  @MessagePattern({ cmd: 'auth.removeAccount' })
  async handleRemoveAccount(@Payload() payload: { userId: string; password?: string }) {
    try {
      await this.userService.deleteAccount(payload.userId, payload.password);
      return { success: true, message: 'Đã xóa tài khoản vĩnh viễn' };
    } catch (err: any) {
      this.logger.error(err);
      return { success: false, message: err.message || 'Xóa tài khoản thất bại' };
    }
  }

  @MessagePattern({ cmd: 'auth.getLogs' })
  async handleGetLogs(@Payload() payload: { userId: string }) {
    try {
      const logs = await this.userService.getLogs(payload.userId);
      return { success: true, data: logs };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'auth.exportData' })
  async handleExportData(@Payload() payload: { userId: string }) {
    try {
      const data = await this.userService.exportData(payload.userId);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'auth.generateQrToken' })
  async handleGenerateQrToken(@Payload() payload: { context?: { ip?: string; ua?: string } }) {
    try {
      const qr = await this.authService.generateQrToken(payload.context);
      return { success: true, data: qr };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'auth.scanQrToken' })
  async handleScanQrToken(@Payload() payload: { token: string; userId: string }) {
    try {
      await this.authService.scanQrToken(payload.token, payload.userId);
      return { success: true, message: 'Đã quét mã' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'auth.confirmQrToken' })
  async handleConfirmQrToken(@Payload() payload: { token: string; userId: string }) {
    try {
      await this.authService.confirmQrToken(payload.token, payload.userId);
      return { success: true, message: 'Đăng nhập thành công trên trình duyệt' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'auth.checkQrStatus' })
  async handleCheckQrStatus(@Payload() payload: { token: string }) {
    try {
      const res = await this.authService.checkQrStatus(payload.token);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'auth.getDevices' })
  async handleGetDevices(@Payload() payload: { userId: string }) {
    try {
      const devices = await this.userService.getDevices(payload.userId);
      return { success: true, data: devices };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  @MessagePattern({ cmd: 'auth.removeDevice' })
  async handleRemoveDevice(@Payload() payload: { userId: string; deviceId: string }) {
    try {
      await this.userService.removeDevice(payload.userId, payload.deviceId);
      return { success: true, message: 'Đã gỡ thiết bị' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
