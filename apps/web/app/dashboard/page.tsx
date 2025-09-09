'use client';

import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button, Card, Col, Row, Typography, Tag, Space } from 'antd';
import { ROUTES } from '../lib/constants';
import {
  UserOutlined,
  LockOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function DashboardContent() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) return <p>Loading...</p>;

  const handleProfileSettings = () => router.push(ROUTES.PROFILE);
  const handleSecurity = () => router.push(ROUTES.SETTINGS);

  return (
    <div style={{ minHeight: '100vh', padding: '24px', background: '#f0f2f5' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2}>Dashboard</Title>
        <Space>
          <Button onClick={logout}>Logout</Button>
          <Button danger>
            Logout All Devices
          </Button>
        </Space>
      </Row>

      {user && (
        <Card title="User Information" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Email:</Text>
              <br />
              <Text>{user.email}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Role:</Text>
              <br />
              <Text>{user.role}</Text>
            </Col>
            <Col span={12}>
              <Text strong>First Name:</Text>
              <br />
              <Text>{user.firstName || 'Not provided'}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Last Name:</Text>
              <br />
              <Text>{user.lastName || 'Not provided'}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Email Verified:</Text>
              <br />
              <Tag color={user.isVerified ? 'green' : 'red'}>
                {user.isVerified ? 'Verified' : 'Not Verified'}
              </Tag>
            </Col>
            <Col span={12}>
              <Text strong>Member Since:</Text>
              <br />
              <Text>{new Date(user.createdAt).toLocaleDateString()}</Text>
            </Col>
          </Row>
        </Card>
      )}

      <Card title="Quick Actions">
        <Row gutter={16}>
          <Col span={8}>
            <Card
              hoverable
              onClick={handleProfileSettings}
              style={{ textAlign: 'center' }}
            >
              <UserOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <Title level={5}>Profile Settings</Title>
              <Text>Update your profile information and preferences</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              hoverable
              onClick={handleSecurity}
              style={{ textAlign: 'center' }}
            >
              <LockOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <Title level={5}>Security</Title>
              <Text>Manage your password and security settings</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <BarChartOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <Title level={5}>Analytics</Title>
              <Text>View your account statistics and activity</Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
