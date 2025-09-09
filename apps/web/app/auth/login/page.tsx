'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { Input, Button, Card, Divider } from 'antd';
import { useAuth } from '@/app/hooks/useAuth';
import { ROUTES, APP_CONFIG, API_ENDPOINTS } from '@/app/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || ROUTES.DASHBOARD;

  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    try {
      const result = await login({ email, password });
      if (result.success) {
        router.push(redirectTo);
      } else {
        setError(result.message || 'Email hoặc mật khẩu không chính xác');
      }
    } catch {
      setError('Đăng nhập không thành công');
    }
  };

  const handleGoogleLogin = () => {
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

        <Input
          prefix={<UserOutlined />}
          placeholder="Nhập email của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="large"
          style={{ marginBottom: 16 }}
        />

        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Nhập mật khẩu của bạn"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          size="large"
          style={{ marginBottom: 16 }}
        />

        <Button
          type="primary"
          size="large"
          block
          onClick={handleSubmit}
          loading={isLoading}
        >
          Đăng nhập
        </Button>

        <Divider style={{ margin: '16px 0' }}>hoặc</Divider>

        <Button
          icon={<GoogleOutlined />}
          size="large"
          style={{ width: '100%', marginBottom: 16 }}
          onClick={handleGoogleLogin}
          disabled={isLoading}
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
