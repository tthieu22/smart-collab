'use client';

import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
  Typography,
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ROUTES, APP_CONFIG } from '@/lib/constants';
import Link from 'next/link';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.LOGIN);
  };

  const handleLogoutAll = async () => {
    // await logoutAll();
    router.push(ROUTES.LOGIN);
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ',
      onClick: () => router.push(ROUTES.PROFILE),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => router.push(ROUTES.SETTINGS),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
    {
      key: 'logoutAll',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất tất cả thiết bị',
      onClick: handleLogoutAll,
    },
  ];

  const mainMenuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link href={ROUTES.DASHBOARD}>Dashboard</Link>,
    },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link href={ROUTES.DASHBOARD}>
          <Text strong style={{ fontSize: '18px', color: '#1677ff' }}>
            {APP_CONFIG.APP_NAME}
          </Text>
        </Link>
        <Menu
          mode='horizontal'
          items={mainMenuItems}
          style={{
            marginLeft: '48px',
            border: 'none',
            background: 'transparent',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Dropdown menu={{ items: userMenuItems }} placement='bottomRight' arrow>
          <Space
            style={{
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '6px',
            }}
            className='hover:bg-gray-50'
          >
            <Avatar size='small' icon={<UserOutlined />} src={user?.avatar} />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <Text strong style={{ fontSize: '14px', lineHeight: '1' }}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text
                type='secondary'
                style={{ fontSize: '12px', lineHeight: '1' }}
              >
                {user?.email}
              </Text>
            </div>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  );
}
