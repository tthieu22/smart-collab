// auth.cookies.ts
import { Response } from 'express';

export function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // chỉ bật HTTPS khi production
    sameSite: 'strict',
    path: '/', // chỉ gửi cookie khi gọi refresh API
    expires: expiresAt,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}
