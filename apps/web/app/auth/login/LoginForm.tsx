'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { Input, Button, Card, Divider } from 'antd';
import Cookies from 'js-cookie';
import { authService } from '@/app/lib/auth';
import { ROUTES, STORAGE_KEYS, ERROR_MESSAGES } from '@/app/lib/constants';
import { useNotificationStore } from '@/app/store/notification';
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || ROUTES.DASHBOARD;
  const { addNotification } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (email: string, password: string) => {
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await authService.login({ email, password });
      if (result.success && result.data?.accessToken) {
        Cookies.set(STORAGE_KEYS.ACCESS_TOKEN, result.data.accessToken, {
          path: '/',
        });
        addNotification("Đăng nhập thành công", "success");
        router.push(redirectTo);
      } else {
        addNotification("Đăng nhập không thành công", "error");
        setError('Email hoặc mật khẩu không chính xác');
      }
    } catch {
      addNotification("Đăng nhập không thành công", "error");
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    router.push(process.env.NEXT_PUBLIC_GOOGLE_LOGIN_URL!);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f6fa',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            Đăng nhập
          </h2>
          <p style={{ color: '#8c8c8c', fontSize: 14 }}>
            Chào mừng bạn quay trở lại!
          </p>
        </header>

        {error && (
          <div
            style={{
              backgroundColor: '#fde2e2',
              color: '#a8071a',
              padding: '12px 16px',
              borderRadius: 4,
              marginBottom: 16,
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={e => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmit(
              formData.get('email') as string,
              formData.get('password') as string
            );
          }}
        >
          <Input
            name='email'
            placeholder='Nhập email của bạn'
            prefix={<UserOutlined />}
            size='large'
            style={{ marginBottom: 16 }}
            autoComplete='off'
          />
          <Input.Password
            name='password'
            placeholder='Nhập mật khẩu của bạn'
            prefix={<LockOutlined />}
            size='large'
            style={{ marginBottom: 16 }}
            autoComplete='off'
          />
          <Button
            type='primary'
            htmlType='submit'
            size='large'
            loading={loading}
            style={{ width: '100%' }}
          >
            Đăng nhập
          </Button>
        </form>

        <Divider style={{ margin: '16px 0' }}>hoặc</Divider>

        <Button
          icon={<GoogleOutlined />}
          size='large'
          style={{ width: '100%', marginBottom: 16 }}
          onClick={handleGoogleLogin}
        >
          Đăng nhập với Google
        </Button>

        <p style={{ textAlign: 'center' }}>
          Chưa có tài khoản?{' '}
          <Link href={ROUTES.REGISTER} style={{ color: '#1677ff' }}>
            Đăng ký ngay
          </Link>
        </p>
      </Card>
    </div>
  );
}
