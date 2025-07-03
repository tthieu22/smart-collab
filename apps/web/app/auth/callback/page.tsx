"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Typography, Spin } from 'antd';

const { Title, Text } = Typography;

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    
    if (accessToken) { 
      localStorage.setItem('accessToken', accessToken);
       
      router.push('/dashboard');
    } else {
      setError('Không nhận được token từ Google OAuth');
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f5f6fa'
      }}>
        <Card 
          style={{ width: 400, textAlign: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
        >
          <Title level={3} style={{ color: '#ff4d4f' }}>Lỗi</Title>
          <Text type="danger">{error}</Text>
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
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f5f6fa'
    }}>
      <Card 
        style={{ width: 400, textAlign: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
      >
        <Spin size="large" />
        <br />
        <br />
        <Title level={4} style={{ color: '#262626' }}>Đang xử lý đăng nhập...</Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>Vui lòng chờ trong giây lát</Text>
      </Card>
    </div>
  );
} 