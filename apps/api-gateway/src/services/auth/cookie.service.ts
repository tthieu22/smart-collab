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
    // Lấy frontendUrl với fallback giống hệt main.ts để đảm bảo đồng nhất
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://tthieu-smart-collab.vercel.app';
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    
    // 100% Xác định môi trường deploy:
    // - Nếu URL chứa https
    // - HOẶC URL không chứa localhost
    // - HOẶC đang chạy trên một cloud platform (Render thường set biến PORT)
    const isHttps = frontendUrl.startsWith('https://');
    const isLocalhost = frontendUrl.includes('localhost');
    const isDeployed = isHttps || !isLocalhost || !!process.env.PORT;

    return {
      httpOnly: true,
      // Nếu là môi trường deploy, BẮT BUỘC phải dùng cấu hình này để browser không chặn
      secure: isDeployed, 
      sameSite: isDeployed ? 'none' : 'lax',
      path: '/',
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
