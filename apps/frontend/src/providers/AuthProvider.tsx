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
      // Các route luôn cho phép không cần login
      const isPublicPath = 
        pathname === ROUTES.LOGIN || 
        pathname === ROUTES.REGISTER || 
        pathname === ROUTES.VERIFY ||
        pathname === ROUTES.FORGOT_PASSWORD ||
        pathname === ROUTES.RESET_PASSWORD ||
        pathname.startsWith('/projects/') || // Cho phép xem project public
        pathname.startsWith('/auth/google/callback');

      if (!accessToken) {
        if (!isPublicPath) {
          router.replace(ROUTES.LOGIN);
        }
      } else {
        // Nếu đã có token và đang ở trang login/register/etc -> đẩy về trang chủ
        if (isPublicPath && !pathname.startsWith('/projects/')) {
          router.replace(ROUTES.HOME);
        }
        
        if (isUserInitialized && !user && !isPublicPath) {
          router.replace(ROUTES.LOGIN);
        }
      }
    }
  }, [isInitialized, isUserInitialized, accessToken, user, router, pathname]);

  return (
    <>
      <GlobalLoading loading={!isInitialized} text="Đang chuẩn bị phi thuyền cộng tác..." />
      {isInitialized && children}
    </>
  );
};
