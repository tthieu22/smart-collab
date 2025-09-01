'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { Input, Button, Card, Divider } from 'antd';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES, APP_CONFIG, API_ENDPOINTS } from '../../lib/constants';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || ROUTES.DASHBOARD;
  const { login, isLoading } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (email: string, password: string) => {
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }

    setError('');

    try {
      const result = await login({ email, password });
      if (result.success) {
        // Redirect will be handled by useAuth hook
        return;
      } else {
        setError(result.message || 'Email hoặc mật khẩu không chính xác');
      }
    } catch (err) {
      setError('Đăng nhập không thành công');
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${APP_CONFIG.API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`;
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
            loading={isLoading}
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
