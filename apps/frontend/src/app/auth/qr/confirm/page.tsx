"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Button, Typography, Result, Spin, message } from "antd";
import { QrcodeOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { autoRequest } from "@smart/services/auto.request";
import { useUserStore } from "@smart/store/user";

const { Title, Text, Paragraph } = Typography;

export default function QrConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { currentUser } = useUserStore();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && currentUser) {
      autoRequest("/auth/qr/scan", {
        method: "POST",
        body: JSON.stringify({ token }),
      }).catch(err => console.error("Scan error", err));
    }
  }, [token, currentUser]);

  const handleConfirm = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await autoRequest<any>("/auth/qr/confirm", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (res.success) {
        setSuccess(true);
        message.success("Xác nhận đăng nhập thành công!");
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Result
          status="warning"
          title="Bạn cần đăng nhập để thực hiện hành động này"
          extra={<Button type="primary" onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)}>Đăng nhập ngay</Button>}
        />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Result
          status="error"
          title="Mã QR không hợp lệ"
          extra={<Button onClick={() => router.push("/")}>Quay lại trang chủ</Button>}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md rounded-3xl shadow-2xl border-none overflow-hidden">
        {success ? (
          <Result
            status="success"
            title="Đăng nhập thành công"
            subTitle="Trình duyệt của bạn sẽ tự động đăng nhập trong giây lát."
            extra={<Button type="primary" className="rounded-xl px-8" onClick={() => window.close()}>Đóng cửa sổ</Button>}
          />
        ) : error ? (
          <Result
            status="error"
            title="Xác nhận thất bại"
            subTitle={error}
            extra={<Button type="primary" className="rounded-xl px-8" onClick={() => router.push("/")}>Quay lại</Button>}
          />
        ) : (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-6">
              <QrcodeOutlined className="text-4xl text-blue-600" />
            </div>
            <Title level={3}>Xác nhận đăng nhập?</Title>
            <Paragraph type="secondary" className="px-4">
              Bạn đang thực hiện đăng nhập trên một thiết bị khác bằng tài khoản:
            </Paragraph>
            <Card className="bg-gray-50 dark:bg-neutral-900 border-none rounded-2xl mb-8">
               <div className="flex items-center gap-4 text-left">
                  <Text strong>{currentUser.email}</Text>
               </div>
            </Card>
            
            <div className="flex flex-col gap-3">
              <Button 
                type="primary" 
                size="large" 
                loading={loading} 
                onClick={handleConfirm}
                className="rounded-xl h-12 font-bold bg-blue-600 border-none shadow-lg shadow-blue-500/20"
              >
                Đồng ý đăng nhập
              </Button>
              <Button 
                type="text" 
                size="large" 
                onClick={() => router.push("/")}
                className="rounded-xl h-12 font-bold opacity-50"
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
