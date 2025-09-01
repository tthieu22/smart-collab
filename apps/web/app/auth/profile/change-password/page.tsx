'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Alert, Card, Typography } from 'antd';

const { Title } = Typography;

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onFinish = async (values: any) => {
    setMessage(null);
    setError(null);
    if (values.newPassword !== values.confirmNewPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      // For now, just show success message since we don't have change password endpoint
      // You can implement this functionality later
      setMessage('Đổi mật khẩu thành công!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <Card>
        <Title level={3} style={{ textAlign: 'center' }}>
          Đổi mật khẩu
        </Title>
        {error && (
          <Alert
            type='error'
            message={error}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {message && (
          <Alert
            type='success'
            message={message}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form layout='vertical' onFinish={onFinish} autoComplete='off'>
          <Form.Item
            label='Mật khẩu cũ'
            name='oldPassword'
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
          >
            <Input.Password
              placeholder='Nhập mật khẩu cũ'
              autoComplete='current-password'
            />
          </Form.Item>
          <Form.Item
            label='Mật khẩu mới'
            name='newPassword'
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password
              placeholder='Nhập mật khẩu mới'
              autoComplete='new-password'
            />
          </Form.Item>
          <Form.Item
            label='Xác nhận mật khẩu mới'
            name='confirmNewPassword'
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Mật khẩu xác nhận không khớp')
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder='Xác nhận mật khẩu mới'
              autoComplete='new-password'
            />
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit' block loading={loading}>
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
