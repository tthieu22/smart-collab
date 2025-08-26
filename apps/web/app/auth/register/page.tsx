'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { authService } from '@/app/lib/auth';
import { ROUTES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/app/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const onFinish = async (values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      setLoading(true);
      setError('');

      // Check if passwords match
      if (values.password !== values.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }

      const result = await authService.register(values);

      if (result.success) {
        // Redirect to login page after successful registration
        router.push(ROUTES.LOGIN);
      } else {
        setError(result.message || ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
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
            Đăng ký
          </h2>
          <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
            Tạo tài khoản mới
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
          name='register'
          onFinish={onFinish}
          autoComplete='off'
          layout='vertical'
        >
          <Form.Item
            name='firstName'
            label='Tên'
            rules={[
              { required: true, message: 'Vui lòng nhập tên!' },
              { min: 2, message: 'Tên phải có ít nhất 2 ký tự!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder='Nhập tên của bạn'
              size='large'
            />
          </Form.Item>

          <Form.Item
            name='lastName'
            label='Họ'
            rules={[
              { required: true, message: 'Vui lòng nhập họ!' },
              { min: 2, message: 'Họ phải có ít nhất 2 ký tự!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder='Nhập họ của bạn'
              size='large'
            />
          </Form.Item>

          <Form.Item
            name='email'
            label='Email'
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder='Nhập email của bạn'
              size='large'
              autoComplete='email'
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
              autoComplete='new-password'
            />
          </Form.Item>

          <Form.Item
            name='confirmPassword'
            label='Xác nhận mật khẩu'
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='Nhập lại mật khẩu'
              size='large'
              autoComplete='new-password'
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
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <p>
            Đã có tài khoản?{' '}
            <Link href={ROUTES.LOGIN} style={{ color: '#1677ff' }}>
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
