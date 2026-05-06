'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LockOutlined, SafetyOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { Input, Button, Tooltip } from 'antd';
import { authService } from '@smart/services/auth.service';
import { useNotificationStore } from '@smart/store/notification';
import { useBoardStore } from '@smart/store/setting';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const { addNotification } = useNotificationStore();
  const { resolvedTheme, setTheme } = useBoardStore();

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleSubmit = async () => {
    if (!email || !code || !newPassword || !confirmPassword) {
      addNotification('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addNotification('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword({ email, code, newPassword });
      if (res.success) {
        addNotification('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.', 'success');
        router.push('/auth/login');
      } else {
        addNotification(res.message || 'Mã xác thực không đúng hoặc đã hết hạn', 'error');
      }
    } catch (err: any) {
      addNotification(err.message || 'Có lỗi xảy ra khi đặt lại mật khẩu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent font-sans relative">
      <div className="fixed top-6 right-6 z-50">
        <Tooltip title={resolvedTheme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}>
          <Button
            shape="circle"
            icon={resolvedTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            size="large"
            className="flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-md border-white/20 dark:border-white/10 shadow-lg hover:scale-110 transition-transform"
          />
        </Tooltip>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[450px] bg-white/70 dark:bg-black/60 backdrop-blur-[10px] rounded-[16px] border border-white/40 dark:border-white/10 p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Đặt lại mật khẩu</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Nhập mã OTP và mật khẩu mới của bạn
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-500 uppercase ml-1">Mã xác thực (OTP)</label>
            <Input
              prefix={<SafetyOutlined className="text-blue-500" />}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              size="large"
              className="h-11 rounded-xl bg-white/50 dark:bg-black/50 border-blue-100/50 dark:border-white/10 tracking-widest font-bold"
              maxLength={6}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-500 uppercase ml-1">Mật khẩu mới</label>
            <Input.Password
              prefix={<LockOutlined className="text-blue-500" />}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              size="large"
              className="h-11 rounded-xl bg-white/50 dark:bg-black/50 border-blue-100/50 dark:border-white/10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-500 uppercase ml-1">Xác nhận mật khẩu</label>
            <Input.Password
              prefix={<LockOutlined className="text-blue-500" />}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              size="large"
              className="h-11 rounded-xl bg-white/50 dark:bg-black/50 border-blue-100/50 dark:border-white/10"
            />
          </div>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleSubmit}
            loading={loading}
            className="h-11 mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none font-bold text-sm shadow-lg shadow-blue-500/25"
          >
            ĐẶT LẠI MẬT KHẨU
          </Button>

          <Link href="/auth/login" className="block text-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mt-4">
             Hủy bỏ và quay lại
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
