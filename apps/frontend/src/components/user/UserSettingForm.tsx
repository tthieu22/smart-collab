"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Form, Input, Button, Avatar, message, Card, 
  Divider, Switch, Tag, Modal, Space, Typography,
  Alert, Statistic, Tooltip, List, Timeline, Empty,
  Spin, Badge
} from "antd";
import { 
  UserOutlined, LockOutlined, MailOutlined, 
  GoogleOutlined, BellOutlined, InfoCircleOutlined,
  DeleteOutlined, CheckCircleFilled, ExclamationCircleFilled,
  EyeInvisibleOutlined, EyeTwoTone, SafetyCertificateOutlined,
  CloudUploadOutlined, HistoryOutlined, PoweroffOutlined,
  RightOutlined, DownloadOutlined, LoginOutlined,
  EditOutlined, KeyOutlined, BlockOutlined, RocketOutlined
} from "@ant-design/icons";
import { useUserStore } from "@smart/store/user";
import { autoRequest } from "@smart/services/auto.request";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const { Title, Text, Paragraph } = Typography;

export function UserSettingForm() {
  const { currentUser, setCurrentUser, clearUserStore } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState("profile");
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [resendTimer, setResendTimer] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteForm] = Form.useForm();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Timer for resend code
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        emailNotifications: currentUser.emailNotifications,
        pushNotifications: currentUser.pushNotifications,
      });
    }
  }, [currentUser, form]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await autoRequest<any>("/auth/audit-logs", { method: "GET" });
      if (res.success) {
        setAuditLogs(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeMenu === "sessions") {
      fetchLogs();
    }
  }, [activeMenu, fetchLogs]);

  const onUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      const res = await autoRequest<any>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(values),
      });

      if (res.success) {
        message.success("Cập nhật thông tin thành công");
        setCurrentUser(res.data);
      } else {
        message.error(res.message || "Cập nhật thất bại");
      }
    } catch (err: any) {
      message.error(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyEmail = async (values: any) => {
    setLoading(true);
    try {
      const res = await autoRequest<any>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: currentUser?.email, code: values.code }),
      });

      if (res.success) {
        message.success("Xác thực email thành công");
        if (currentUser) setCurrentUser({ ...currentUser, isVerified: true });
      } else {
        message.error(res.message || "Xác thực thất bại");
      }
    } catch (err: any) {
      message.error(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    setLoading(true);
    try {
      const res = await autoRequest<any>("/auth/resend-code", {
        method: "POST",
      });

      if (res.success) {
        message.success("Đã gửi lại mã xác thực");
        setResendTimer(60);
      } else {
        message.error(res.message || "Gửi lại mã thất bại");
      }
    } catch (err: any) {
      message.error(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (values: any) => {
    setLoading(true);
    try {
      const res = await autoRequest<any>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(values),
      });

      if (res.success) {
        message.success("Đổi mật khẩu thành công");
        passwordForm.resetFields();
      } else {
        message.error(res.message || "Đổi mật khẩu thất bại");
      }
    } catch (err: any) {
      message.error(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  const onDisconnectGoogle = async () => {
    Modal.confirm({
      title: "Hủy liên kết Google",
      content: "Bạn có chắc chắn muốn hủy liên kết với tài khoản Google này không?",
      onOk: async () => {
        try {
          const res = await autoRequest<any>("/auth/disconnect-google", { method: "POST" });
          if (res.success) {
            message.success("Đã hủy liên kết");
            if (currentUser) setCurrentUser({ ...currentUser, googleId: null });
          }
        } catch (err: any) {
          message.error("Lỗi: " + err.message);
        }
      }
    });
  };

  const onDeleteAccount = async (values: any) => {
    setLoading(true);
    try {
      const res = await autoRequest<any>("/auth/delete-account", {
        method: "POST",
        body: JSON.stringify({ password: values.password }),
      });

      if (res.success) {
        message.success("Tài khoản đã được đánh dấu xóa. Bạn có 30 ngày để khôi phục.");
        clearUserStore();
        window.location.href = "/auth/login";
      } else {
        message.error(res.message || "Xóa tài khoản thất bại");
      }
    } catch (err: any) {
      message.error(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleToggleSetting = async (key: string, value: boolean) => {
    try {
      const res = await autoRequest<any>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ [key]: value }),
      });
      if (res.success) {
        setCurrentUser(res.data);
        message.success("Đã cập nhật cài đặt");
      }
    } catch (err: any) {
      message.error("Lỗi: " + err.message);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const res = await autoRequest<any>("/auth/export-data", { method: "GET" });
      if (res.success) {
        const dataStr = JSON.stringify(res.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `user_data_${currentUser?.id}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        message.success("Đã tải xuống dữ liệu cá nhân");
      }
    } catch (err: any) {
      message.error("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { key: "profile", label: "Thông tin cá nhân", icon: <UserOutlined /> },
    { key: "security", label: "Mật khẩu và bảo mật", icon: <SafetyCertificateOutlined /> },
    { key: "verification", label: "Xác thực email", icon: <MailOutlined /> },
    { key: "social", label: "Liên kết mạng xã hội", icon: <GoogleOutlined /> },
    { key: "notifications", label: "Cài đặt thông báo", icon: <BellOutlined /> },
    { key: "sessions", label: "Hoạt động & Nhật ký", icon: <HistoryOutlined /> },
    { key: "devices", label: "Quản lý thiết bị", icon: <BlockOutlined /> },
    { key: "account", label: "Thông tin tài khoản", icon: <InfoCircleOutlined /> },
  ];

  const [devices, setDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const fetchDevices = useCallback(async () => {
    setDevicesLoading(true);
    try {
      const res = await autoRequest<any>("/auth/devices", { method: "GET" });
      if (res.success) setDevices(res.data || []);
    } catch (err) {
      console.error("Failed to fetch devices", err);
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  const onRemoveDevice = async (deviceId: string) => {
    try {
      const res = await autoRequest<any>(`/auth/devices/remove/${deviceId}`, { method: "DELETE" });
      if (res.success) {
        message.success("Đã đăng xuất thiết bị");
        fetchDevices();
      }
    } catch (err: any) {
      message.error("Lỗi: " + err.message);
    }
  };

  useEffect(() => {
    if (activeMenu === "devices") fetchDevices();
  }, [activeMenu, fetchDevices]);

  const renderContent = () => {
    switch (activeMenu) {
      case "profile":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-start">
              <div>
                <Title level={4} className="!mb-1">Thông tin cá nhân</Title>
                <Text type="secondary">Cập nhật ảnh đại diện và tên hiển thị của bạn.</Text>
              </div>
              <Badge status="processing" text="Hoạt động" />
            </div>

            <div className="flex flex-col items-center sm:flex-row gap-8 py-6 bg-gray-50/50 dark:bg-neutral-900/50 rounded-[24px] border border-gray-100 dark:border-neutral-800 p-6">
              <div className="relative group">
                <Avatar 
                  size={100} 
                  src={currentUser?.avatar} 
                  icon={!currentUser?.avatar && <UserOutlined />} 
                  className="border-2 border-blue-500/20 shadow-2xl transition-transform group-hover:scale-105 duration-300"
                />
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900 cursor-pointer hover:bg-blue-700 transition-colors">
                   <CloudUploadOutlined />
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <Title level={5} className="!m-0">{currentUser?.firstName} {currentUser?.lastName}</Title>
                <Text type="secondary" className="text-xs">ID: {currentUser?.id}</Text>
                <div className="flex gap-2 mt-1">
                   <Button type="primary" size="small" className="rounded-lg h-8 px-4 font-medium">Thay đổi ảnh</Button>
                   <Button type="text" danger size="small" className="rounded-lg h-8 font-medium">Xóa ảnh</Button>
                </div>
              </div>
            </div>

            <Form form={form} layout="vertical" onFinish={onUpdateProfile} className="max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <Form.Item label="Họ" name="firstName" rules={[{ required: true, message: 'Vui lòng nhập họ' }]}>
                  <Input prefix={<UserOutlined className="opacity-30" />} placeholder="Họ" className="h-11 rounded-xl bg-gray-50/50 dark:bg-neutral-900/50 border-gray-200 dark:border-neutral-800 focus:bg-white dark:focus:bg-neutral-950 transition-all" />
                </Form.Item>
                <Form.Item label="Tên" name="lastName" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                  <Input placeholder="Tên" className="h-11 rounded-xl bg-gray-50/50 dark:bg-neutral-900/50 border-gray-200 dark:border-neutral-800 focus:bg-white dark:focus:bg-neutral-950 transition-all" />
                </Form.Item>
              </div>
              <Form.Item label="Email" name="email">
                <Input disabled prefix={<MailOutlined className="opacity-30" />} className="h-11 rounded-xl opacity-70" />
              </Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className="h-11 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 border-none font-bold shadow-lg shadow-blue-500/20 mt-2"
              >
                Lưu thay đổi
              </Button>
            </Form>
          </div>
        );

      case "security":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <Title level={4} className="!mb-1">Mật khẩu và bảo mật</Title>
              <Text type="secondary">Thay đổi mật khẩu định kỳ để đảm bảo an toàn cho tài khoản.</Text>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-6">
                  <Form form={passwordForm} layout="vertical" onFinish={onChangePassword}>
                    <Form.Item label="Mật khẩu hiện tại" name="oldPassword" rules={[{ required: true, message: 'Nhập mật khẩu cũ' }]}>
                      <Input.Password prefix={<LockOutlined className="opacity-30" />} className="h-11 rounded-xl" />
                    </Form.Item>
                    <Divider />
                    <Form.Item label="Mật khẩu mới" name="newPassword" rules={[{ required: true, min: 8, message: 'Tối thiểu 8 ký tự' }]}>
                      <Input.Password prefix={<KeyOutlined className="opacity-30" />} className="h-11 rounded-xl" />
                    </Form.Item>
                    <Form.Item label="Xác nhận mật khẩu mới" name="confirmNewPassword" rules={[{ required: true }, ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                      },
                    })]}>
                      <Input.Password prefix={<KeyOutlined className="opacity-30" />} className="h-11 rounded-xl" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} className="h-11 px-10 rounded-xl font-bold bg-neutral-900 dark:bg-white dark:text-neutral-950 border-none">
                      Đổi mật khẩu
                    </Button>
                  </Form>
               </div>
               
               <div className="space-y-4">
                  <Card className="rounded-2xl border-none bg-orange-50 dark:bg-orange-900/10">
                    <Title level={5} className="!text-orange-700 !m-0 flex items-center gap-2">
                      <RocketOutlined /> Bảo mật thông minh
                    </Title>
                    <Paragraph className="text-orange-700/80 text-xs mt-2">
                      Hệ thống sẽ tự động phát hiện mật khẩu yếu hoặc các đăng nhập bất thường để cảnh báo cho bạn.
                    </Paragraph>
                  </Card>
                  <Card className="rounded-2xl border-none bg-blue-50 dark:bg-blue-900/10">
                    <Title level={5} className="!text-blue-700 !m-0 flex items-center gap-2">
                      <SafetyCertificateOutlined /> Xác thực 2 lớp (2FA)
                    </Title>
                    <Paragraph className="text-blue-700/80 text-xs mt-2">
                      Sắp có: Thêm một lớp bảo mật bằng ứng dụng Authenticator.
                    </Paragraph>
                  </Card>
               </div>
            </div>

            <Divider />
            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/20">
              <Title level={5} className="!text-red-600 !mt-0 flex items-center gap-2">
                <DeleteOutlined /> Vùng nguy hiểm
              </Title>
              <Paragraph className="text-red-600/80 mb-4 text-sm">
                Khi xóa tài khoản, tất cả dữ liệu của bạn sẽ bị đánh dấu xóa. Bạn có 30 ngày để khôi phục trước khi dữ liệu biến mất vĩnh viễn.
              </Paragraph>
              <Button danger ghost onClick={() => setIsDeleteModalOpen(true)} className="rounded-lg h-10 font-bold border-red-600/50 hover:bg-red-600 hover:text-white transition-all">
                Xóa tài khoản của tôi
              </Button>
            </div>
          </div>
        );

      case "verification":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <Title level={4} className="!mb-1">Xác thực email</Title>
              <Text type="secondary">Đảm bảo hòm thư {currentUser?.email} chính chủ để bảo vệ quyền lợi của bạn.</Text>
            </div>

            {currentUser?.isVerified ? (
              <div className="py-12 flex flex-col items-center justify-center bg-green-50/30 dark:bg-green-900/5 rounded-3xl border-2 border-dashed border-green-200 dark:border-green-900/20">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 shadow-xl shadow-green-500/20">
                   <CheckCircleFilled className="text-4xl text-green-500" />
                </div>
                <Title level={4} className="!text-green-700 !m-0 text-center">Xác thực thành công</Title>
                <Text className="text-green-600/70 mt-2">Email {currentUser.email} đã được bảo vệ.</Text>
              </div>
            ) : (
              <div className="space-y-6">
                <Alert
                  message="Yêu cầu xác thực"
                  description="Chúng tôi đã gửi mã 6 số đến email của bạn. Vui lòng kiểm tra hộp thư đến (hoặc thư rác)."
                  type="warning"
                  showIcon
                  className="rounded-2xl"
                />
                <Form form={otpForm} onFinish={onVerifyEmail} className="max-w-xs mx-auto text-center">
                  <Form.Item name="code" rules={[{ required: true, len: 6, message: 'Mã gồm 6 chữ số' }]}>
                    <Input 
                      placeholder="000000" 
                      maxLength={6} 
                      className="h-16 text-3xl tracking-[0.4em] font-black text-center rounded-2xl border-2 border-orange-200 focus:border-orange-500 shadow-lg shadow-orange-500/5"
                    />
                  </Form.Item>
                  <Space direction="vertical" className="w-full">
                    <Button type="primary" htmlType="submit" loading={loading} className="w-full h-12 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 border-none shadow-lg shadow-orange-500/20">
                      Xác thực ngay
                    </Button>
                    <Button 
                      type="text" 
                      disabled={resendTimer > 0} 
                      onClick={onResendCode}
                      className="text-orange-600 font-medium"
                    >
                      {resendTimer > 0 ? `Gửi lại mã sau ${resendTimer}s` : "Gửi lại mã xác thực"}
                    </Button>
                  </Space>
                </Form>
              </div>
            )}
          </div>
        );

      case "social":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <Title level={4} className="!mb-1">Liên kết hệ sinh thái</Title>
              <Text type="secondary">Kết nối với các nền tảng khác để đăng nhập nhanh chóng.</Text>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 rounded-[24px] bg-gray-50/50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800 hover:border-red-200 dark:hover:border-red-900/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <GoogleOutlined className="text-2xl text-red-500" />
                  </div>
                  <div>
                    <Text className="block font-bold">Google account</Text>
                    {currentUser?.googleId ? (
                      <Text type="success" className="text-xs flex items-center gap-1"><CheckCircleFilled /> Đã kết nối</Text>
                    ) : (
                      <Text type="secondary" className="text-xs">Tiện lợi cho đăng nhập 1 chạm.</Text>
                    )}
                  </div>
                </div>
                {currentUser?.googleId ? (
                  <Button danger size="small" className="rounded-lg h-8 px-4" onClick={onDisconnectGoogle}>Gỡ liên kết</Button>
                ) : (
                  <Button size="small" className="rounded-lg h-8 px-4 bg-white dark:bg-neutral-800">Kết nối</Button>
                )}
              </div>

              <div className="flex items-center justify-between p-6 rounded-[24px] bg-gray-50/50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800 opacity-50 grayscale">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm">
                    <RocketOutlined className="text-2xl text-gray-400" />
                  </div>
                  <div>
                    <Text className="block font-bold">GitHub</Text>
                    <Text type="secondary" className="text-xs">Dành cho nhà phát triển.</Text>
                  </div>
                </div>
                <Tag>Sắp ra mắt</Tag>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <Title level={4} className="!mb-1">Cài đặt thông báo</Title>
              <Text type="secondary">Quản lý cách SmartCollab tương tác với bạn.</Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-4 p-6 rounded-3xl bg-blue-50/30 dark:bg-blue-900/5 border border-blue-100 dark:border-blue-900/20">
                <div className="flex items-center justify-between">
                   <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      <MailOutlined className="text-xl" />
                   </div>
                   <Switch 
                    checked={currentUser?.emailNotifications} 
                    onChange={(checked) => handleToggleSetting("emailNotifications", checked)} 
                  />
                </div>
                <div>
                  <Text className="block font-bold">Email Notifications</Text>
                  <Text type="secondary" className="text-[11px]">Bản tin hàng tuần và thông báo bảo mật.</Text>
                </div>
              </div>

              <div className="flex flex-col gap-4 p-6 rounded-3xl bg-purple-50/30 dark:bg-purple-900/5 border border-purple-100 dark:border-purple-900/20">
                <div className="flex items-center justify-between">
                   <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                      <BellOutlined className="text-xl" />
                   </div>
                   <Switch 
                    checked={currentUser?.pushNotifications} 
                    onChange={(checked) => handleToggleSetting("pushNotifications", checked)} 
                  />
                </div>
                <div>
                  <Text className="block font-bold">Web Push</Text>
                  <Text type="secondary" className="text-[11px]">Thông báo ngay khi có tương tác mới.</Text>
                </div>
              </div>
            </div>
          </div>
        );

      case "sessions":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <Title level={4} className="!mb-1">Hoạt động & Nhật ký</Title>
              <Text type="secondary">Theo dõi các hành động gần đây trên tài khoản của bạn.</Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <Card className="rounded-2xl border-none shadow-sm bg-blue-600 text-white">
                  <Statistic 
                    title={<span className="text-blue-100">Tổng lượt truy cập</span>} 
                    value={currentUser?.loginCount || 0} 
                    valueStyle={{ color: '#fff', fontWeight: 900 }}
                    prefix={<LoginOutlined />}
                  />
               </Card>
               <Card className="rounded-2xl border-none shadow-sm bg-gray-50 dark:bg-neutral-900 md:col-span-2">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        <CheckCircleFilled />
                     </div>
                     <div>
                        <Text className="block font-bold">Trạng thái bảo mật</Text>
                        <Text type="success" className="text-xs">Mạnh mẽ - Mọi hoạt động đều bình thường</Text>
                     </div>
                  </div>
               </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Title level={5} className="!m-0">Nhật ký hoạt động</Title>
                <Button type="text" size="small" onClick={fetchLogs} icon={<HistoryOutlined />}>Làm mới</Button>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {logsLoading ? (
                  <div className="py-12 text-center"><Spin /></div>
                ) : auditLogs.length > 0 ? (
                  <Timeline
                    className="mt-4"
                    items={auditLogs.map(log => ({
                      color: log.action === 'LOGIN' ? 'blue' : log.action === 'CHANGE_PASSWORD' ? 'red' : 'green',
                      children: (
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between">
                            <Text className="font-bold text-sm">{log.action}</Text>
                            <Text className="text-[10px] opacity-40">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: vi })}</Text>
                          </div>
                          <Text type="secondary" className="text-xs">{log.details}</Text>
                        </div>
                      ),
                    }))}
                  />
                ) : (
                  <Empty description="Chưa có nhật ký nào" />
                )}
              </div>
            </div>
          </div>
        );

      case "devices":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <Title level={4} className="!mb-1">Quản lý thiết bị</Title>
              <Text type="secondary">Danh sách các thiết bị đang đăng nhập tài khoản của bạn.</Text>
            </div>

            <div className="space-y-4">
              {devicesLoading ? (
                <div className="py-12 text-center"><Spin /></div>
              ) : devices.length > 0 ? (
                devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-6 rounded-[24px] bg-gray-50/50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm">
                        <PoweroffOutlined className={device.refreshToken ? "text-green-500" : "text-gray-400"} />
                      </div>
                      <div>
                        <Text className="block font-bold">{device.deviceName}</Text>
                        <div className="flex items-center gap-2">
                          <Text type="secondary" className="text-xs">{device.ip}</Text>
                          <Divider type="vertical" />
                          <Text type="secondary" className="text-xs">
                            {formatDistanceToNow(new Date(device.lastUsed), { addSuffix: true, locale: vi })}
                          </Text>
                        </div>
                      </div>
                    </div>
                    <Button 
                      danger 
                      type="text" 
                      onClick={() => onRemoveDevice(device.id)}
                      className="rounded-lg hover:bg-red-50"
                    >
                      Đăng xuất
                    </Button>
                  </div>
                ))
              ) : (
                <Empty description="Không có thiết bị nào" />
              )}
            </div>

            <Alert
              message="An toàn bảo mật"
              description="Nếu bạn thấy thiết bị lạ, hãy đăng xuất ngay lập tức và đổi mật khẩu."
              type="warning"
              showIcon
              className="rounded-2xl"
            />
          </div>
        );

      case "account":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <div>
                <Title level={4} className="!mb-1">Thông tin tài khoản</Title>
                <Text type="secondary">Chi tiết về dữ liệu người dùng của bạn.</Text>
              </div>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleExportData}
                loading={loading}
                className="rounded-xl font-bold h-10 px-6 border-blue-500 text-blue-500"
              >
                Xuất dữ liệu (.json)
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="rounded-[24px] shadow-none border-gray-100 dark:border-neutral-800 bg-gray-50/30 dark:bg-neutral-900/30">
                <Statistic title="Email đăng ký" value={currentUser?.email || ""} valueStyle={{ fontSize: 16, fontWeight: 700 }} />
              </Card>
              <Card className="rounded-[24px] shadow-none border-gray-100 dark:border-neutral-800 bg-gray-50/30 dark:bg-neutral-900/30">
                <Statistic 
                  title="Vai trò hệ thống" 
                  value={currentUser?.role || ""} 
                  valueStyle={{ fontSize: 16, fontWeight: 700, color: currentUser?.role === 'ADMIN' ? '#f50' : '#2db7f5' }} 
                />
              </Card>
              <Card className="rounded-[24px] shadow-none border-gray-100 dark:border-neutral-800 bg-gray-50/30 dark:bg-neutral-900/30">
                <Statistic 
                  title="Ngày tham gia" 
                  value={currentUser?.createdAt ? format(new Date(currentUser.createdAt), 'dd MMMM, yyyy', { locale: vi }) : "-"} 
                  valueStyle={{ fontSize: 16, fontWeight: 700 }} 
                />
              </Card>
              <Card className="rounded-[24px] shadow-none border-gray-100 dark:border-neutral-800 bg-gray-50/30 dark:bg-neutral-900/30">
                <Statistic title="API Access" value="Sắp ra mắt" valueStyle={{ fontSize: 16, opacity: 0.5 }} />
              </Card>
            </div>

            <Alert
              message="Quyền riêng tư"
              description="Dữ liệu của bạn được bảo vệ theo chuẩn quốc tế. Chúng tôi không chia sẻ thông tin cá nhân của bạn cho bên thứ ba."
              type="info"
              showIcon
              className="rounded-2xl"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[750px] overflow-hidden">
      {/* Sidebar - Scrollable independently */}
      <div className="w-full lg:w-[280px] shrink-0 overflow-y-auto pr-2 custom-scrollbar lg:max-h-full">
        <div className="space-y-2 pb-8 lg:pb-0">
          {sidebarItems.map((item) => (
            <div
              key={item.key}
              onClick={() => setActiveMenu(item.key)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${
                activeMenu === item.key 
                ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 font-semibold" 
                : "hover:bg-gray-50 dark:hover:bg-neutral-900 text-gray-700 dark:text-gray-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg transition-colors ${activeMenu === item.key ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"}`}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </div>
              <div className={`text-xs text-gray-400 transition-opacity ${activeMenu === item.key ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                ›
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area - Scrollable independently */}
      <Card 
        className="flex-1 border border-gray-100 dark:border-neutral-800 rounded-[32px] bg-white dark:bg-neutral-950 overflow-hidden flex flex-col"
        style={{ boxShadow: '0 20px 50px -12px rgba(0,0,0,0.08)' }}
        styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-5xl mx-auto h-full">
             {renderContent()}
          </div>
        </div>
      </Card>

      {/* Delete Account Modal */}
      <Modal
        title={null}
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        footer={null}
        className="rounded-3xl overflow-hidden"
        centered
        width={400}
      >
        <div className="text-center py-6">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <ExclamationCircleFilled className="text-4xl text-red-600" />
          </div>
          <Title level={3} className="!mb-2">Xác nhận xóa</Title>
          <Paragraph type="secondary" className="px-4">
            Dữ liệu sẽ được lưu trữ 30 ngày trước khi bị xóa hoàn toàn. Nhập mật khẩu để tiếp tục.
          </Paragraph>
          
          <Form form={deleteForm} layout="vertical" onFinish={onDeleteAccount} className="px-4">
            <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu để tiếp tục' }]}>
              <Input.Password placeholder="Mật khẩu bảo mật" className="h-12 rounded-xl text-center" />
            </Form.Item>
            <Space direction="vertical" className="w-full" size="middle">
              <Button danger type="primary" htmlType="submit" loading={loading} className="w-full h-12 rounded-xl font-black text-lg bg-red-600 hover:bg-red-700 border-none shadow-lg shadow-red-500/20">
                Xóa tài khoản
              </Button>
              <Button type="text" onClick={() => setIsDeleteModalOpen(false)} className="w-full h-10 font-bold opacity-50 hover:opacity-100">
                Tôi muốn ở lại
              </Button>
            </Space>
          </Form>
        </div>
      </Modal>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
