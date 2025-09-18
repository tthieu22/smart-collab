import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  UnauthorizedException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { setRefreshCookie, clearRefreshCookie } from './auth.cookies';
import { randomBytes } from 'crypto';
import { OtcService } from '../otc/otc.store';
import { RegisterDto } from './dto/register.dto';
import { Prisma, Role } from '@prisma/client';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

interface UserWithPassword {
  id: string;
  email: string;
  password: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  googleId: string | null;
  role: Role;
  isVerified: boolean;
  emailVerificationCode: string | null;
  emailVerificationCodeExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UserService,
    private readonly otcService: OtcService,
  ) {}

  /** 🔑 Login */
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    const user = (await this.users.findByEmail(dto.email)) as UserWithPassword;
    if (
      !user ||
      !(await bcrypt.compare(dto.password || '', user.password || ''))
    ) {
      const passwordToCompare = dto.password || '';
      const hashedPassword = user?.password || '';
      const isMatch = await bcrypt.compare(passwordToCompare, hashedPassword);

      console.log('DTO password:', passwordToCompare);
      console.log('User hashed password:', hashedPassword);
      console.log('bcrypt.compare result:', isMatch);

      return { success: false, message: 'Thông tin tài khoản không chính xác' };
    }
    if (!user.isVerified) {
      return {
        success: false,
        message: 'Email chưa được xác thực',
        data: { needsVerified: true },
      };
    }

    const sessionId = randomBytes(16).toString('hex');
    const context: Partial<{ device: string; ua: string; ip: string }> = {
      device: sessionId,
      ua: req.headers['user-agent'] as string,
    };

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
    const tokens = await this.auth.issueTokensForUser(
      { id: user.id, email: user.email, role: user.role },
      context,
    );

    setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
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

  /** 📝 Register */
  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto): Promise<ApiResponse> {
    try {
      const existing = await this.users.findByEmail(dto.email);
      if (existing) return { success: false, message: 'Email đã được sử dụng' };

      const newUser = await this.users.create({
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        role: Role.USER,
      });

      return {
        success: true,
        message: 'Đăng ký thành công, vui lòng xác thực email',
        data: newUser,
      };
    } catch (error) {
      return { success: false, message: error.message || 'Đăng ký thất bại' };
    }
  }

  /** 🌀 Refresh token */
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    const raw = (req as any).cookies?.refresh_token;
    if (!raw) throw new UnauthorizedException('Missing refresh token');

    const payload = await this.auth.validateRefreshToken(raw);
    if (!payload?.userId)
      throw new UnauthorizedException('Invalid refresh token');

    const sessionId = randomBytes(16).toString('hex');
    const context: Partial<{ device: string; ua: string; ip: string }> = {
      device: sessionId,
      ua: req.headers['user-agent'] as string,
    };

    const tokens = await this.auth.rotateRefreshToken(
      payload.userId,
      raw,
      context,
    );

    if (!tokens) throw new UnauthorizedException('Failed to refresh token');

    setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    return {
      success: true,
      message: 'Refreshed',
      data: { accessToken: tokens.accessToken },
    };
  }

  /** 👋 Logout current device */
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    const raw = (req as any).cookies?.refresh_token;
    if (raw) {
      await this.auth.rotateRefreshToken('', raw, undefined, {
        revokeOnly: true,
      });
    }
    clearRefreshCookie(res);
    return { success: true, message: 'Logged out' };
  }

  /** 🔒 Logout all devices */
  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    const userId = (req.user as any)?.sub || (req.user as any)?.id;
    if (!userId) throw new UnauthorizedException();

    await this.auth.logoutAllDevices(userId);
    clearRefreshCookie(res);

    return { success: true, message: 'Logged out from all devices' };
  }

  /** 👤 Current user info */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request): Promise<ApiResponse> {
    // Lấy userId từ JWT payload
    const userId =
      (req.user as any)?.userId ||
      (req.user as any)?.sub ||
      (req.user as any)?.id;

    if (!userId) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      const user = await this.users.findOne(userId);
      return { success: true, message: 'OK', data: user };
    } catch (error: any) {
      console.error('[ERROR] /auth/me:', error);
      return { success: false, message: error.message || 'User not found' };
    }
  }

  /** Google OAuth */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<void> {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const profile = req.user as any;
    const email = profile.emails?.[0]?.value || profile.email;
    const avatar = profile.photos?.[0]?.value || profile._json?.picture;
    if (!email) throw new Error('Google profile does not contain email');

    const user = await this.auth.upsertGoogleUser({
      id: profile.id,
      email,
      givenName: profile.name?.givenName,
      familyName: profile.name?.familyName,
      avatar,
    });

    const code = randomBytes(24).toString('hex');
    await this.otcService.putOTC(
      code,
      { userId: user.id, email: user.email, role: user.role },
      120,
    );

    const cb =
      process.env.FRONTEND_GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/auth/google/callback';
    res.redirect(`${cb}?code=${code}`);
  }

  /** Google OAuth exchange */
  @Post('oauth/exchange')
  @HttpCode(200)
  async oauthExchange(
    @Body() body: { code: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const rec = await this.otcService.takeOTC(body.code);
    if (!rec) return { success: false, message: 'Invalid or expired code' };

    const sessionId = randomBytes(16).toString('hex');
    const context: Partial<{ device: string; ua: string; ip: string }> = {
      device: sessionId,
      ua: req.headers['user-agent'] as string,
    };

    const tokens = await this.auth.issueTokensForUser(
      { id: rec.userId, email: rec.email, role: rec.role as Role },
      context,
    );

    setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    return {
      success: true,
      message: 'OAuth exchange success',
      data: { accessToken: tokens.accessToken },
    };
  }

  /** Verify email */
  @Post('verify-email')
  async verifyEmail(
    @Body() body: { email: string; code: string },
  ): Promise<ApiResponse> {
    try {
      const isVerified = await this.users.verifyEmail(body.email, body.code);
      return isVerified
        ? { success: true, message: 'Email verified successfully' }
        : { success: false, message: 'Invalid or expired verification code' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /** Validate user credentials */
  @Post('validate-user')
  async validateUser(
    @Body() body: { email: string; password: string },
  ): Promise<ApiResponse> {
    const user = (await this.users.findByEmail(body.email)) as UserWithPassword;

    if (
      !user ||
      !(await bcrypt.compare(body.password || '', user.password || ''))
    ) {
      return { success: false, message: 'Invalid credentials' };
    }

    if (!user.isVerified)
      return { success: false, message: 'Email not verified' };

    const { password, ...safeUser } = user;
    return {
      success: true,
      message: 'User validated successfully',
      data: safeUser,
    };
  }
}
