'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@smart/hooks/useAuth';
import GlobalLoading from '@smart/components/ui/GlobalLoading';
import { ROUTES } from '@smart/lib/constants';
import { useUserStore } from '@smart/store/user';
import { useAuthStore } from '@smart/store/auth';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useAuth();
  const { isUserInitialized } = useUserStore();
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (isInitialized) {
      // Các route chỉ cho phép khi đã đăng nhập
      const isProtectedPath =
        pathname?.startsWith('/admin') ||
        pathname?.startsWith('/user/settings');

      // Các trang xác thực (login, register...)
      const isAuthPage =
        pathname === ROUTES.LOGIN ||
        pathname === ROUTES.REGISTER ||
        pathname === ROUTES.FORGOT_PASSWORD ||
        pathname === ROUTES.RESET_PASSWORD ||
        pathname?.startsWith('/auth/google/callback');

      if (!accessToken) {
        // Nếu chưa đăng nhập mà truy cập route yêu cầu đăng nhập -> chuyển về trang Home
        if (isProtectedPath) {
          router.replace(ROUTES.HOME);
        }
      } else {
        // Nếu đã có token và đang ở trang login/register -> chuyển về trang Home
        if (isAuthPage) {
          router.replace(ROUTES.HOME);
        }
        
        if (isUserInitialized && !user && isProtectedPath) {
          router.replace(ROUTES.HOME);
        }
      }
    }
  }, [isInitialized, isUserInitialized, accessToken, user, router, pathname]);

  return (
    <>
      <GlobalLoading loading={!isInitialized} text="Đang chuẩn bị không gian làm việc..." />
      {isInitialized && children}
    </>
  );
};
