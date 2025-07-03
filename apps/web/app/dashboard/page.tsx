"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Typography, Space, Alert } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "@/app/hooks/useAuth";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user, loading, getUserInfo, logout } = useAuth();
  const router = useRouter();

  useEffect(() => { 
    getUserInfo().then((user) => {
      if (!user) {
        router.push("/auth/login");
      }
    });
  }, [getUserInfo, router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Text>Loading...</Text>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        background: "#f5f6fa",
        minHeight: "100vh",
      }}
    >
      <Card
        style={{
          maxWidth: 800,
          margin: "0 auto",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ color: "#262626" }}>
            Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: "16px" }}>
            Chào mừng bạn đến với AuthNexus
          </Text>
        </div>

        {user && (
          <div style={{ marginBottom: 24 }}>
            {user && user.isEmailVerified === false && (
              <div style={{ marginBottom: 24 }}>
                <Alert
                  message="Tài khoản của bạn chưa xác thực email."
                  description={
                    <Button
                      type="link"
                      onClick={() => router.push(`/auth/verify?email=${encodeURIComponent(user.email)}`)}
                    >
                      Xác thực ngay
                    </Button>
                  }
                  type="warning"
                  showIcon
                />
              </div>
            )}
            <Title level={4}>Thông tin tài khoản</Title>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text>
                <strong>Email:</strong> {user.email}
              </Text>
              <Text>
                <strong>Vai trò:</strong> {user.role}
              </Text>
              <Text>
                <strong>Xác thực email:</strong>{" "}
                {user.isEmailVerified ? "Đã xác thực" : "Chưa xác thực"}
              </Text>
            </Space>
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={logout}
            size="large"
          >
            Đăng xuất
          </Button>
        </div>
      </Card>
    </div>
  );
}