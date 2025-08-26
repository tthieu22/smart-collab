'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string>(
    'Đang xử lý đăng nhập Google...'
  );

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('accessToken');
      if (token) {
        localStorage.setItem('accessToken', token);
        // Set a non-HTTPOnly cookie so Next middleware can read it
        document.cookie = `accessToken=${token}; path=/; max-age=900; samesite=lax`;
        router.replace('/dashboard');
      } else {
        setMessage('Không tìm thấy accessToken. Vui lòng thử lại.');
        // Nếu BE trả JSON thay vì redirect, thử gọi /auth/me để xác thực.
        setTimeout(() => router.replace('/auth/login'), 1500);
      }
    } catch (e) {
      setMessage('Có lỗi xảy ra. Vui lòng thử lại.');
      setTimeout(() => router.replace('/auth/login'), 1500);
    }
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: 16,
      }}
    >
      {message}
    </div>
  );
}
