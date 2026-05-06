'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailOutlined, ArrowLeftOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { Input, Button, Tooltip } from 'antd';
import { authService } from '@smart/services/auth.service';
import { useNotificationStore } from '@smart/store/notification';
import { useBoardStore } from '@smart/store/setting';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { addNotification } = useNotificationStore();
  const { resolvedTheme, setTheme } = useBoardStore();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleSubmit = async () => {
    if (!email) {
      addNotification('Vui lòng nhập email', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.forgotPassword(email);
      if (res.success) {
        addNotification('Mã khôi phục đã được gửi đến email của bạn', 'success');
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        addNotification(res.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (err: any) {
      addNotification(err.message || 'Không thể yêu cầu khôi phục mật khẩu', 'error');
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] bg-white/70 dark:bg-black/60 backdrop-blur-[10px] rounded-[16px] border border-white/40 dark:border-white/10 p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Quên mật khẩu</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Nhập email của bạn để nhận mã khôi phục mật khẩu
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-500 uppercase ml-1">Email khôi phục</label>
            <Input
              prefix={<MailOutlined className="text-blue-500" />}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            className="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none font-bold text-sm shadow-lg shadow-blue-500/25"
          >
            GỬI MÃ KHÔI PHỤC
          </Button>

          <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mt-4">
            <ArrowLeftOutlined /> Quay lại đăng nhập
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
