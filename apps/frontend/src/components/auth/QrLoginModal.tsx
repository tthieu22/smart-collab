"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Spin, Typography, message, Result } from "antd";
import { QrcodeOutlined, ReloadOutlined, CheckCircleFilled, ExclamationCircleFilled } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { autoRequest } from "@smart/services/auto.request";
import { useAuthStore } from "@smart/store/auth";
import { useUserStore } from "@smart/store/user";
import { useRouter } from "next/navigation";
import { ROUTES } from "@smart/lib/constants";

const { Title, Text, Paragraph } = Typography;

export function QrLoginModal({ open, onCancel }: { open: boolean, onCancel: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"PENDING" | "SCANNED" | "CONFIRMED" | "EXPIRED">("PENDING");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { login: storeLogin, setAccessToken } = useAuthStore();
  const { setCurrentUser, setUserInitialized } = useUserStore();

  const generateToken = async () => {
    setLoading(true);
    try {
      const res = await autoRequest<any>("/auth/qr/generate", { method: "POST" });
      if (res.success) {
        setToken(res.data.token);
        setStatus("PENDING");
      }
    } catch (err) {
      message.error("Không thể tạo mã QR");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      generateToken();
    } else {
      setToken(null);
      setStatus("PENDING");
    }
  }, [open]);

  useEffect(() => {
    let interval: any;
    if (open && token && status === "PENDING") {
      interval = setInterval(async () => {
        try {
          const res = await autoRequest<any>(`/auth/qr/check/${token}`, { method: "GET" });
          if (res.success) {
            if (res.data.status === "CONFIRMED") {
              setStatus("CONFIRMED");
              clearInterval(interval);
              
              // Handle Login
              const { accessToken, user } = res.data;
              if (accessToken && user) {
                storeLogin(accessToken);
                setAccessToken(accessToken);
                setCurrentUser(user);
                setUserInitialized(true);
                message.success("Đăng nhập thành công!");
                router.push(ROUTES.DASHBOARD);
                onCancel();
              }
            } else if (res.data.status === "EXPIRED") {
              setStatus("EXPIRED");
              clearInterval(interval);
            }
          }
        } catch (err) {
          console.error("Poll error", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [open, token, status, storeLogin, setAccessToken, setCurrentUser, setUserInitialized, router, onCancel]);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      width={360}
      className="qr-login-modal"
    >
      <div className="text-center py-8 flex flex-col items-center">
        <Title level={4} className="!mb-6">Đăng nhập bằng mã QR</Title>
        
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : status === "EXPIRED" ? (
          <div className="h-[200px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl w-full border border-dashed border-gray-200">
            <ExclamationCircleFilled className="text-4xl text-gray-400 mb-4" />
            <Text type="secondary">Mã QR đã hết hạn</Text>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={generateToken} 
              className="mt-4 rounded-xl"
            >
              Làm mới mã
            </Button>
          </div>
        ) : status === "CONFIRMED" ? (
          <div className="h-[200px] flex flex-col items-center justify-center">
            <CheckCircleFilled className="text-6xl text-green-500 mb-4" />
            <Text strong>Đã xác nhận!</Text>
            <Text type="secondary">Đang chuyển hướng...</Text>
          </div>
        ) : status === "SCANNED" ? (
          <div className="h-[200px] flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
               <Spin size="large" />
            </div>
            <Text strong>Đã quét mã!</Text>
            <Text type="secondary">Vui lòng xác nhận trên điện thoại...</Text>
          </div>
        ) : token ? (
          <div className="p-4 bg-white rounded-3xl shadow-xl border border-gray-100 mb-6">
            <QRCodeSVG 
              value={`${window.location.origin}/auth/qr/confirm?token=${token}`} 
              size={200} 
            />
          </div>
        ) : null}

        {status === "PENDING" && !loading && (
          <div className="mt-2 text-center">
            <Paragraph type="secondary" className="text-sm px-6">
              Mở ứng dụng <b>SmartCollab</b> trên điện thoại để quét mã này.
            </Paragraph>
            <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
              <Spin size="small" /> <span>Đang chờ quét...</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
