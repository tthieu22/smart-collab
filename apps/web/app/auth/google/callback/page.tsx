'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Typography, Spin } from 'antd';
import { useNotificationStore } from '@/app/store/notification';
const { Title, Text } = Typography;

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const { addNotification } = useNotificationStore();
  useEffect(() => {
    const accessToken = searchParams.get('accessToken');

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      // Set cookie so middleware can detect authentication
      document.cookie = `accessToken=${accessToken}; path=/; max-age=900; samesite=lax`;
      addNotification("Đăng nhập thành công", "success");
      router.push('/dashboard');
    } else {
      addNotification("Đăng nhập không thành công", "error");
      setError('Không nhận được token từ Google OAuth');
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f5f6fa',
        }}
      >
        <Card
          style={{
            width: 400,
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Title level={3} style={{ color: '#ff4d4f' }}>
            Lỗi
          </Title>
          <Text type='danger'>{error}</Text>
          <br />
          <br />
          <Text
            style={{ color: '#1677ff', cursor: 'pointer' }}
            onClick={() => router.push('/auth/login')}
          >
            Quay lại trang đăng nhập
          </Text>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f6fa',
      }}
    >
      <Card
        style={{
          width: 400,
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Spin size='large' />
        <br />
        <br />
        <Title level={4} style={{ color: '#262626' }}>
          Đang xử lý đăng nhập...
        </Title>
        <Text type='secondary' style={{ fontSize: '14px' }}>
          Vui lòng chờ trong giây lát
        </Text>
      </Card>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f5f6fa',
          }}
        >
          <Card
            style={{
              width: 400,
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Spin size='large' />
            <br />
            <br />
            <Title level={4} style={{ color: '#262626' }}>
              Đang tải...
            </Title>
          </Card>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
