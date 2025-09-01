'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { Loading } from '@/components/ui/loading';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = ROUTES.LOGIN,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Wait for initialization to complete before making redirect decisions
    if (isInitialized && !isLoading && !hasRedirected) {
      if (requireAuth && !isAuthenticated) {
        setHasRedirected(true);
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        setHasRedirected(true);
        router.push(ROUTES.DASHBOARD);
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    isInitialized,
    requireAuth,
    redirectTo,
    router,
    hasRedirected,
  ]);

  // Show loading while initializing or loading
  if (isLoading || !isInitialized) {
    return <Loading fullScreen text='Đang kiểm tra xác thực...' />;
  }

  // Don't render children if we're redirecting
  if (hasRedirected) {
    return null;
  }

  // For protected routes, don't render if not authenticated
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // For public routes, don't render if authenticated (will redirect to dashboard)
  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
