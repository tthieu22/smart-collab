import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpException,
  HttpStatus,
  HttpCode,
  Res,
  Req,
  UseGuards,
  UnauthorizedException,
  Param,
  Delete,
  Headers,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { CookieService } from '../services/auth/cookie.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  LoginDto,
  RegisterDto,
  VerifyEmailDto,
  ValidateUserDto,
  OAuthExchangeDto,
} from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authClient: AuthService,
    private readonly cookieService: CookieService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    try {
      const result = await this.authClient.login(loginDto);

      // Xử lý cookies nếu login thành công
      if (result.success && result.data) {
        if (result.data.refreshToken) {
          this.cookieService.setRefreshCookie(
            res,
            result.data.refreshToken,
            new Date(result.data.refreshTokenExpiresAt),
          );
        }
        
        if (result.data.accessToken) {
          // Mặc định 15 phút nếu không có accessTokenExpiresAt
          const accessExpiresAt = result.data.accessTokenExpiresAt 
            ? new Date(result.data.accessTokenExpiresAt)
            : new Date(Date.now() + 15 * 60 * 1000);
            
          this.cookieService.setAccessCookie(
            res,
            result.data.accessToken,
            accessExpiresAt,
          );
        }
      }

      return result;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('register')
  @HttpCode(201)
  async register(@Body() registerDto: RegisterDto): Promise<ApiResponse> {
    try {
      const result = await this.authClient.register(registerDto);
      return result;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
      console.log('Refresh Token from Cookie/Body:', refreshToken ? 'Found' : 'Missing');
      
      if (!refreshToken) {
        throw new UnauthorizedException('Missing refresh token');
      }

      const result = await this.authClient.refresh({ refreshToken });

      // Cập nhật cookies nếu thành công
      if (result.success && result.data) {
        if (result.data.refreshToken) {
          this.cookieService.setRefreshCookie(
            res,
            result.data.refreshToken,
            new Date(result.data.refreshTokenExpiresAt),
          );
        }
        
        if (result.data.accessToken) {
          const accessExpiresAt = result.data.accessTokenExpiresAt 
            ? new Date(result.data.accessTokenExpiresAt)
            : new Date(Date.now() + 15 * 60 * 1000);
            
          this.cookieService.setAccessCookie(
            res,
            result.data.accessToken,
            accessExpiresAt,
          );
        }
      }

      return result;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Token refresh failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (refreshToken) {
        await this.authClient.logout({ refreshToken });
      }

      // Xóa cookies
      this.cookieService.clearAllAuthCookies(res);

      return { success: true, message: 'Logged out' };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Logout failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.id;
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      await this.authClient.logoutAll({ userId });
      this.cookieService.clearAllAuthCookies(res);

      return { success: true, message: 'Logged out from all devices' };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Logout all failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Headers('authorization') authHeader: string, @Req() req: any): Promise<ApiResponse> {
    try {
      // Lấy token từ header
      const token = authHeader?.split(' ')[1]; // "Bearer <token>"
      console.log('Token:', token);

      const userId = req.user?.userId;
      console.log(userId);
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      return this.authClient.getCurrentUser({ userId });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Get user failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Post('verify-email')
  async verifyEmail(@Body() verifyDto: VerifyEmailDto): Promise<ApiResponse> {
    try {
      const result = await this.authClient.verifyEmail(verifyDto);
      return result;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Email verification failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('validate-user')
  async validateUser(
    @Body() validateDto: ValidateUserDto,
  ): Promise<ApiResponse> {
    try {
      const result = await this.authClient.validateUser(validateDto);
      return result;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'User validation failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
    /** Google OAuth */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<void> {
    console.log('⚡️ [/auth/google] hit -> redirecting to Google OAuth');
  }
  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleRedirect(@Req() req: Request, @Res() res: Response): Promise<void> {
    this.logger.debug('⚡️ [/auth/google/redirect] handler calleed');

    const cb = this.configService.get<string>('FRONTEND_GOOGLE_CALLBACK_URL')
      ?? 'http://localhost:3000/auth/callback/google';

    try {
      this.logger.debug('👉 req.user:', req.user);

      const userResp = req.user as any;
      let user = userResp;

      // Nếu userResp có success (kiểu wrapper), lấy data bên trong
      if (userResp.hasOwnProperty('success')) {
        if (!userResp.success) {
          throw new Error(userResp.message || 'Upsert user failed');
        }
        user = userResp.data;
      }

      if (!user?.email) {
        throw new Error('Google profile does not contain email');
      }

      this.logger.debug('✅ Final user object:', user);

      const result = await this.authClient.generateOAuthCode({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      if (!result?.success || !result.data?.code) {
        throw new Error('Failed to generate OAuth code');
      }

      const code = result.data.code;
      this.logger.debug(`✅ Generated OAuth code: ${code}`);

      return res.redirect(`${cb}?code=${code}`);
    } catch (error: any) {
      this.logger.error(
        `[ERROR] /auth/google/redirect: ${error.message}`,
        error.stack,
      );

      return res.redirect(
        `${cb}?error=${encodeURIComponent(error.message || 'OAuth failed')}`,
      );
    }
  }


  @Post('oauth/exchange')
  @HttpCode(200)
  async oauthExchange(
    @Body() oauthDto: OAuthExchangeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    console.log('⚡️ [/auth/oauth/exchange] body:', oauthDto);

    try {
      const result = await this.authClient.oauthExchange(oauthDto);
      console.log('✅ oauthExchange result:', result);

      if (result.success && result.data) {
        if (result.data.refreshToken) {
          this.cookieService.setRefreshCookie(
            res,
            result.data.refreshToken,
            new Date(result.data.refreshTokenExpiresAt),
          );
        }
        
        if (result.data.accessToken) {
          const accessExpiresAt = result.data.accessTokenExpiresAt 
            ? new Date(result.data.accessTokenExpiresAt)
            : new Date(Date.now() + 15 * 60 * 1000);
            
          this.cookieService.setAccessCookie(
            res,
            result.data.accessToken,
            accessExpiresAt,
          );
        }
      }

      return result;
    } catch (error: any) {
      console.error('[ERROR] /auth/oauth/exchange:', error);

      throw new HttpException(
        error.message || 'OAuth exchange failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() body: any): Promise<ApiResponse> {
    try {
      const userId = req.user.userId;
      return await this.authClient.updateProfile({ userId, data: body });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Update profile failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: any, @Body() body: any): Promise<ApiResponse> {
    try {
      const userId = req.user.userId;
      return await this.authClient.changePassword({ userId, data: body });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Change password failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('resend-code')
  @UseGuards(JwtAuthGuard)
  async resendCode(@Req() req: any): Promise<ApiResponse> {
    try {
      const email = req.user.email;
      return await this.authClient.resendCode({ email });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Resend code failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('disconnect-google')
  @UseGuards(JwtAuthGuard)
  async disconnectGoogle(@Req() req: any): Promise<ApiResponse> {
    try {
      const userId = req.user.userId;
      return await this.authClient.disconnectGoogle({ userId });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Disconnect Google failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('delete-account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Req() req: any, @Body() body: { password?: string }): Promise<ApiResponse> {
    try {
      const userId = req.user.userId;
      return await this.authClient.removeAccount({ userId, password: body.password });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Delete account failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('audit-logs')
  @UseGuards(JwtAuthGuard)
  async getAuditLogs(@Req() req: any): Promise<ApiResponse> {
    try {
      const userId = req.user.userId;
      return await this.authClient.getLogs({ userId });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Get audit logs failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export-data')
  @UseGuards(JwtAuthGuard)
  async exportData(@Req() req: any): Promise<ApiResponse> {
    try {
      const userId = req.user.userId;
      return await this.authClient.exportData({ userId });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Export data failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('qr/generate')
  async generateQr(@Req() req: any): Promise<ApiResponse> {
    try {
      const context = {
        ip: req.ip || req.connection.remoteAddress,
        ua: req.headers['user-agent'],
      };
      return await this.authClient.generateQrToken({ context });
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('qr/scan')
  @UseGuards(JwtAuthGuard)
  async scanQr(@Req() req: any, @Body() body: { token: string }): Promise<ApiResponse> {
    try {
      const userId = req.user.userId;
      return await this.authClient.scanQrToken({ token: body.token, userId });
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('qr/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmQr(@Req() req: any, @Body() body: { token: string }): Promise<ApiResponse> {
    try {
      const userId = req.user.userId;
      return await this.authClient.confirmQrToken({ token: body.token, userId });
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('qr/check/:token')
  async checkQr(@Param('token') token: string, @Res({ passthrough: true }) res: Response): Promise<ApiResponse> {
    try {
      const result = await this.authClient.checkQrStatus({ token });
      
      if (result.success && result.data?.status === 'CONFIRMED' && result.data) {
        if (result.data.refreshToken) {
          this.cookieService.setRefreshCookie(
            res,
            result.data.refreshToken,
            new Date(result.data.refreshTokenExpiresAt),
          );
        }
        
        if (result.data.accessToken) {
          const accessExpiresAt = result.data.accessTokenExpiresAt 
            ? new Date(result.data.accessTokenExpiresAt)
            : new Date(Date.now() + 15 * 60 * 1000);
            
          this.cookieService.setAccessCookie(
            res,
            result.data.accessToken,
            accessExpiresAt,
          );
        }
      }
      
      return result;
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  async getDevices(@Req() req: any): Promise<ApiResponse> {
    try {
      const userId = req.user.userId;
      return await this.authClient.getDevices({ userId });
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('devices/remove/:id')
  @UseGuards(JwtAuthGuard)
  async removeDevice(@Req() req: any, @Param('id') deviceId: string): Promise<ApiResponse> {
    try {
      const userId = req.user.userId;
      return await this.authClient.removeDevice({ userId, deviceId });
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
