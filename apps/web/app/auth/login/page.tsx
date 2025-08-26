'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Button, Card, Input } from 'antd';
import { authService } from '@/app/lib/auth';
import { ROUTES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/app/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setError('');
      setLoading(true);

      const result = await authService.login(values);
      if (result.success) {
        console.log(router);
        console.log(ROUTES.DASHBOARD);
        router.push(ROUTES.DASHBOARD);
      } else {
        setError(result.message || ERROR_MESSAGES.UNKNOWN_ERROR);
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
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#262626',
            }}
          >
            Đăng nhập
          </h2>
          <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
            Chào mừng bạn quay trở lại!
          </p>
        </div>

        {error && (
          <Alert
            message={error}
            type='error'
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          name='login'
          onFinish={onFinish}
          autoComplete='off'
          layout='vertical'
        >
          <Form.Item
            name='email'
            label='Email'
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder='Nhập email của bạn'
              size='large'
              autoComplete='username'
            />
          </Form.Item>

          <Form.Item
            name='password'
            label='Mật khẩu'
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='Nhập mật khẩu của bạn'
              size='large'
              autoComplete='current-password'
            />
          </Form.Item>

          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
              size='large'
              loading={loading}
              style={{ width: '100%' }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Divider>hoặc</Divider>

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
