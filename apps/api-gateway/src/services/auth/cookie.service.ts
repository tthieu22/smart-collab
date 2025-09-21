import { Injectable } from '@nestjs/common';
import { Response } from 'express';

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
  private readonly defaultOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

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
