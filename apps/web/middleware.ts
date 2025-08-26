import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value;

  // Các route công khai (public)
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/verify',
    '/auth/callback',
    '/auth/google/callback',
    '/', // cho phép trang chủ public
  ];

  // Kiểm tra xem route hiện tại có phải public không
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // Người dùng chưa đăng nhập → chặn truy cập vào route protected
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // để redirect lại sau khi login
    return NextResponse.redirect(loginUrl);
  }

  // Người dùng đã đăng nhập nhưng vào trang auth → chuyển hướng dashboard
  if (token && isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
