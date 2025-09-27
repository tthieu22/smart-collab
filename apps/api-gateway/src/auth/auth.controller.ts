import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
  HttpCode,
  Res,
  Req,
  UseGuards,
  UnauthorizedException,
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
      if (result.success && result.data?.refreshToken) {
        this.cookieService.setRefreshCookie(
          res,
          result.data.refreshToken,
          new Date(result.data.refreshTokenExpiresAt),
        );
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
      const refreshToken = req.cookies?.refresh_token;
      console.log(refreshToken, "Cookie");
      if (!refreshToken) {
        throw new UnauthorizedException('Missing refresh token');
      }

      const result = await this.authClient.refresh({ refreshToken });

      // Cập nhật refresh token cookie nếu thành công
      if (result.success && result.data?.refreshToken) {
        this.cookieService.setRefreshCookie(
          res,
          result.data.refreshToken,
          new Date(result.data.refreshTokenExpiresAt),
        );
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

      // req.user là { success, message, data }
      const userResp = req.user as any;
      const user = userResp.data;

      if (!user?.email) {
        throw new Error('Google profile does not contain email');
      }

      this.logger.debug('✅ Upserted user:', user);

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

      if (result.success && result.data?.refreshToken) {
        this.cookieService.setRefreshCookie(
          res,
          result.data.refreshToken,
          new Date(result.data.refreshTokenExpiresAt),
        );
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
}
