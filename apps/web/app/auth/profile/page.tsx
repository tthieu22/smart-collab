"use client";

import { Card, Typography, Space, Descriptions, Tag, Button } from "antd";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh"
      }}>
        <Text>Loading...</Text>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div style={{
      padding: "24px",
      background: "#f5f6fa",
      minHeight: "100vh"
    }}>
      <Card
        style={{
          maxWidth: 600,
          margin: "0 auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ color: "#262626" }}>
            Thông tin cá nhân
          </Title>
          <Text type="secondary" style={{ fontSize: "16px" }}>
            Xem và quản lý thông tin tài khoản của bạn
          </Text>
        </div>
        <Descriptions
          bordered
          column={1}
          labelStyle={{ fontWeight: 600, width: 180 }}
          contentStyle={{ fontSize: 16 }}
        >
          <Descriptions.Item label="ID">{user._id }</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Họ tên">
            {user.lastName} {user.firstName}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag color="blue">{user.role}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {user.isActive ? (
              <Tag color="green">Đang hoạt động</Tag>
            ) : (
              <Tag color="red">Bị khóa</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Xác thực email">
            {user.isEmailVerified ? (
              <Tag color="green">Đã xác thực</Tag>
            ) : (
              <Tag color="orange">Chưa xác thực</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {new Date(user.createdAt).toLocaleString("vi-VN")}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày cập nhật">
            {new Date(user.updatedAt).toLocaleString("vi-VN")}
          </Descriptions.Item>
        </Descriptions>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Button type="default" block onClick={() => router.push("/auth/profile/change-password")}>Đổi mật khẩu</Button>
            <Button type="default" block onClick={() => router.push("/auth/profile/edit")}>Chỉnh sửa thông tin cá nhân</Button>
            <Button type="primary" danger block onClick={logout}>
              Đăng xuất
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}