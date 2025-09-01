'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Loading } from '../ui/loading';
import { ROUTES } from '../../lib/constants';

interface WithAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  redirectTo: string = ROUTES.LOGIN
) => {
  return function WithAuthComponent(props: P) {
    const { isAuthenticated, isLoading, accessToken, fetchUser } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      const checkAuth = async () => {
        if (isLoading) return;

        if (!isAuthenticated && accessToken) {
          // Try to fetch user data if we have token but no user
          try {
            const user = await fetchUser();
            if (!user) {
              router.push(redirectTo);
              return;
            }
          } catch (error) {
            router.push(redirectTo);
            return;
          }
        } else if (!isAuthenticated && !accessToken) {
          // No token, redirect immediately
          router.push(redirectTo);
          return;
        }

        setIsChecking(false);
      };

      checkAuth();
    }, [
      isAuthenticated,
      isLoading,
      accessToken,
      router,
      redirectTo,
      fetchUser,
    ]);

    if (isLoading || isChecking) {
      return <Loading fullScreen text='Đang kiểm tra xác thực...' />;
    }

    if (!isAuthenticated) {
      return null; // Will redirect
    }

    return <WrappedComponent {...props} />;
  };
};

// Alternative: Simple component wrapper
export const ProtectedRoute: React.FC<WithAuthProps> = ({
  children,
  redirectTo = ROUTES.LOGIN,
}) => {
  const { isAuthenticated, isLoading, accessToken, fetchUser } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoading) return;

      if (!isAuthenticated && accessToken) {
        // Try to fetch user data if we have token but no user
        try {
          const user = await fetchUser();
          if (!user) {
            router.push(redirectTo);
            return;
          }
        } catch (error) {
          router.push(redirectTo);
          return;
        }
      } else if (!isAuthenticated && !accessToken) {
        // No token, redirect immediately
        router.push(redirectTo);
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, isLoading, accessToken, router, redirectTo, fetchUser]);

  if (isLoading || isChecking) {
    return <Loading fullScreen text='Đang kiểm tra xác thực...' />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <>{children}</>;
};
