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
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthClientService } from '../services/auth/auth-client.service';
import { CookieService } from '../services/auth/cookie.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  LoginDto,
  RegisterDto,
  VerifyEmailDto,
  ValidateUserDto,
  OAuthExchangeDto,
} from '../dto/auth.dto';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authClient: AuthClientService,
    private readonly cookieService: CookieService,
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
  async me(@Req() req: Request): Promise<ApiResponse> {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.id;
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      const result = await this.authClient.getCurrentUser({ userId });
      return result;
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

  @Post('oauth/exchange')
  @HttpCode(200)
  async oauthExchange(
    @Body() oauthDto: OAuthExchangeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    try {
      const result = await this.authClient.oauthExchange(oauthDto);

      // Xử lý cookies nếu OAuth exchange thành công
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
        error.message || 'OAuth exchange failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
