'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@smart/hooks/useAuth';
import { Loading } from '@smart/components/ui/loading';
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
        pathname.startsWith('/projects/') || // Cho phép xem project public
        pathname.startsWith('/auth/google/callback');

      if (!accessToken) {
        if (!isPublicPath) {
          router.replace(ROUTES.LOGIN);
        }
      } else if (isUserInitialized) {
        if (!user && !isPublicPath) {
          router.replace(ROUTES.LOGIN);
        }
      }
    }
  }, [isInitialized, isUserInitialized, accessToken, user, router, pathname]);

  // Chỉ cho phép vào app khi đã init xong auth. 
  // Nếu đã có token, phải đợi init xong thông tin user nữa mới cho vào để tránh bị trống Avatar/Profile.
  const shouldShowLoading = !isInitialized || (!!accessToken && !isUserInitialized);

  if (shouldShowLoading) {
    return <Loading text=" " />;
  }

  return <>{children}</>;
};
