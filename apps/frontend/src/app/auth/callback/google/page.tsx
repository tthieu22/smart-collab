'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@smart/services/auth.service';
import { Loading } from '@smart/components/ui/loading';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    if (code) {
      processedRef.current = true;
      authService.oauthExchange(code)
        .then(() => {
          router.push('/');
        })
        .catch((err) => {
          console.error('OAuth exchange error:', err);
          router.push(`/auth/login?error=${encodeURIComponent(err.message || 'Xác thực thất bại')}`);
        });
    } else if (error) {
      processedRef.current = true;
      console.error('Google OAuth error:', error);
      const timer = setTimeout(() => {
        router.push(`/auth/login?error=${encodeURIComponent(error)}`);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      router.push('/auth/login');
    }
  }, [code, error, router]);

  if (error) {
    return <Loading text={`Lỗi: ${error}. Đang quay lại trang đăng nhập...`} />;
  }

  return <Loading text="Đăng nhập thành công! Đang chuyển hướng" />;
}
