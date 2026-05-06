import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

@Injectable()
export class CookieService {
  constructor(private readonly configService: ConfigService) {}

  private get defaultOptions(): CookieOptions {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    
    // Kiểm tra xem yêu cầu có đến từ một môi trường bảo mật (HTTPS) không
    const isHttps = frontendUrl.startsWith('https://');
    const isLocalhost = frontendUrl.includes('localhost');
    const isProduction = nodeEnv === 'production';

    // Cookie bảo mật chỉ hoạt động trên HTTPS
    // sameSite: 'none' BẮT BUỘC phải có secure: true
    // Nếu chạy local (http), dùng 'lax'. Nếu deploy (https), dùng 'none' để hỗ trợ cross-site.
    const useSecure = isHttps; 

    return {
      httpOnly: true,
      secure: useSecure,
      sameSite: useSecure ? 'none' : 'lax',
      path: '/',
      // Nếu deploy trên các domain khác nhau (ví dụ: api.com và app.com), 
      // có thể cần cấu hình thêm domain ở đây, nhưng mặc định để undefined là an toàn nhất.
    };
  }

  setRefreshCookie(
    res: Response,
    refreshToken: string,
    expiresAt: Date,
    options?: Partial<CookieOptions>,
  ): void {
    const cookieOptions = {
      ...this.defaultOptions,
      ...options,
      maxAge: expiresAt.getTime() - Date.now(),
    };

    res.cookie('refresh_token', refreshToken, cookieOptions);
  }

  clearRefreshCookie(res: Response, options?: Partial<CookieOptions>): void {
    const cookieOptions = {
      ...this.defaultOptions,
      ...options,
      maxAge: 0,
    };

    res.cookie('refresh_token', '', cookieOptions);
  }

  setAccessCookie(
    res: Response,
    accessToken: string,
    expiresAt: Date,
    options?: Partial<CookieOptions>,
  ): void {
    const cookieOptions = {
      ...this.defaultOptions,
      ...options,
      maxAge: expiresAt.getTime() - Date.now(),
    };

    res.cookie('access_token', accessToken, cookieOptions);
  }

  clearAccessCookie(res: Response, options?: Partial<CookieOptions>): void {
    const cookieOptions = {
      ...this.defaultOptions,
      ...options,
      maxAge: 0,
    };

    res.cookie('access_token', '', cookieOptions);
  }

  clearAllAuthCookies(res: Response): void {
    this.clearRefreshCookie(res);
    this.clearAccessCookie(res);
  }
}
