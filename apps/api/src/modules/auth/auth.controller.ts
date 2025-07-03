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

// Standardized response interface
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    try {
      const user = await this.userService.findByEmail(loginDto.email);
      if (
        !user ||
        !(await bcrypt.compare(loginDto.password, user.password || ''))
      ) {
        return { success: false, message: 'Invalid credentials' };
      }
      const tokens = await this.authService.login(user);
      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: false,
      });
      return {
        success: true,
        message: 'Login successful',
        data: {
          accessToken: tokens.accessToken,
          user: { email: user.email, role: user.role },
        },
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Google OAuth2
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<ApiResponse> {
    return { success: true, message: 'Google authentication initiated' };
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<ApiResponse | void> {
    try {
      const user = req.user as any;
      const payload = {
        sub: user._id?.toString() || user.id?.toString(),
        email: user.email,
        role: user.role,
      };
      const accessToken = this.authService['jwtService'].sign(payload, {
        expiresIn: '15m',
      });
      const refreshToken = this.authService['jwtService'].sign(payload, {
        expiresIn: '7d',
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: false,
      });
      const frontendCallback = process.env.FRONTEND_GOOGLE_CALLBACK_URL;
      if (frontendCallback) {
        res.redirect(`${frontendCallback}?accessToken=${accessToken}`);
        return;
      }
      return {
        success: true,
        message: 'Google authentication successful',
        data: { accessToken, user },
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request): Promise<ApiResponse> {
    try {
      const userId =
        (req.user as any).userId ||
        (req.user as any).sub ||
        (req.user as any)._id;
      const user = await this.userService.findOne(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      const userObj = (user as any).toObject
        ? (user as any).toObject()
        : { ...user };
      delete userObj.password;
      return {
        success: true,
        message: 'User data retrieved successfully',
        data: userObj,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('verify-email')
  async verifyEmail(
    @Body() body: { email: string; code: string },
  ): Promise<ApiResponse> {
    try {
      const user = await this.userService.findByEmail(body.email);
      if (
        !user ||
        user.emailVerificationCode !== body.code ||
        new Date() > new Date(user.emailVerificationCodeExpires || '')
      ) {
        return {
          success: false,
          message: 'Invalid or expired verification code',
        };
      }

      user.isEmailVerified = true;
      user.emailVerificationCode = undefined;
      user.emailVerificationCodeExpires = undefined;
      await this.userService.update((user as any)._id, user);

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('validate-user')
  async validateUser(
    @Body() body: { email: string; password: string },
  ): Promise<ApiResponse> {
    const { email, password } = body;
    const user = await this.userService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password || ''))) {
      return { success: false, message: 'Invalid credentials' };
    }
    if (!user.isEmailVerified) {
      return { success: false, message: 'Email not verified' };
    }

    const userObj = { ...user } as any;
    delete userObj.password;
    return {
      success: true,
      message: 'User validated successfully',
      data: userObj,
    };
  }
}
