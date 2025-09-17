'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { Input, Button, Card, Divider } from 'antd';
import { authService } from '@mood/services/auth.service';
import { useAuthStore } from '@mood/store/auth';
import { useUserStore } from '@mood/store/user';
import { useNotificationStore } from '@mood/store/notification';
import { ROUTES, APP_CONFIG, API_ENDPOINTS } from '@mood/lib/constants';
import type { LoginCredentials, ApiError } from '@mood/types/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || ROUTES.DASHBOARD;

  const { login: storeLogin, setAccessToken, setLoading } = useAuthStore();
  const { setCurrentUser, setUserInitialized } = useUserStore();
  const { addNotification } = useNotificationStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLocalLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      addNotification('Vui lòng nhập email và mật khẩu', 'error');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      addNotification('Email không hợp lệ', 'error');
      return;
    }

    const credentials: LoginCredentials = { email, password };

    try {
      setLocalLoading(true);
      setLoading(true);

      const res = await authService.login(credentials);

      const accessToken = res.data?.accessToken;
      const user = res.data?.user;

      if (!res.success || !accessToken || !user) {
        if (res.data?.needsVerified) {
          addNotification(
            'Email chưa xác thực',
            'warning',
            true,
            3000,
          );
          router.push(ROUTES.VERIFY);
          return;
        }

        if (res.data?.needsPassword) {
          addNotification(
            'Vui lòng tạo mật khẩu cho tài khoản Google',
            'warning',
            true,
            3000,
          );
          router.push('/auth/create-password');
          return;
        }
        addNotification(res.message || 'Email hoặc mật khẩu không chính xác', 'error');
        return;
      }

      // Login thành công
      storeLogin(accessToken);
      setAccessToken(accessToken);
      setCurrentUser(user);
      setUserInitialized(true);

      addNotification('Đăng nhập thành công', 'success', true, 3000);
      router.push(redirectTo);
      return;
    } catch (err: unknown) {
      if ((err as ApiError).success === false) {
        addNotification((err as ApiError).message || 'Đăng nhập không thành công', 'error');
      } else if (err instanceof Error) {
        addNotification(err.message, 'error');
      } else {
        addNotification('Đăng nhập không thành công', 'error');
      }
    } finally {
      setLocalLoading(false);
      setLoading(false);
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
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Đăng nhập</h2>
          <p style={{ color: '#8c8c8c', fontSize: 14 }}>Chào mừng bạn quay trở lại!</p>
        </header>

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
          loading={loading}
        >
          Đăng nhập
        </Button>

        <Divider style={{ margin: '16px 0' }}>hoặc</Divider>

        <Button
          icon={<GoogleOutlined />}
          size="large"
          style={{ width: '100%', marginBottom: 16 }}
          onClick={handleGoogleLogin}
          disabled={loading}
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
