// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('accessToken')?.value;
  const { pathname } = req.nextUrl;

  // Nếu chưa có token và không phải đang ở /auth/login => redirect
  if (!token && pathname !== '/auth/login') {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}
