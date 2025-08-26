'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Button, Card, Divider, Input } from 'antd';
import { authService } from '@/app/lib/auth';
import { ROUTES, ERROR_MESSAGES, STORAGE_KEYS } from '@/app/lib/constants';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || ROUTES.DASHBOARD;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      if (!values.email || !values.password) {
        setError('Vui lòng nhập email và mật khẩu');
        return;
      }

      setError('');
      setLoading(true);

      const result = await authService.login(values);

      if (result.success && result.data?.accessToken) {
        // Lưu token vào cookie để middleware nhận
        Cookies.set(STORAGE_KEYS.ACCESS_TOKEN, result.data.accessToken, {
          path: '/',
        });

        router.push(redirectTo); // chuyển hướng về dashboard hoặc redirect query
      } else {
        setError('Email hoặc mật khẩu không chính xác');
      }
    } catch (err) {
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
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f6fa',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 8,
              color: '#262626',
            }}
          >
            Đăng nhập
          </h2>
          <p style={{ color: '#8c8c8c', fontSize: 14 }}>
            Chào mừng bạn quay trở lại!
          </p>
        </div>

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
            onFinish({
              email: formData.get('email') as string,
              password: formData.get('password') as string,
            });
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <label>Email</label>
            <Input
              name='email'
              prefix={<UserOutlined />}
              placeholder='Nhập email của bạn'
              size='large'
              autoComplete='off'
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Mật khẩu</label>
            <Input.Password
              name='password'
              prefix={<LockOutlined />}
              placeholder='Nhập mật khẩu của bạn'
              size='large'
              autoComplete='off'
            />
          </div>

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

        <div style={{ textAlign: 'center' }}>
          <p>
            Chưa có tài khoản?{' '}
            <Link href={ROUTES.REGISTER} style={{ color: '#1677ff' }}>
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
