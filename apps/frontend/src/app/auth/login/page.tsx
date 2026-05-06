'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserOutlined, LockOutlined, GoogleOutlined, QrcodeOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { Input, Button, Divider, Tooltip } from 'antd';
import { authService } from '@smart/services/auth.service';
import { useAuthStore } from '@smart/store/auth';
import { useUserStore } from '@smart/store/user';
import { useNotificationStore } from '@smart/store/notification';
import { useBoardStore } from '@smart/store/setting';
import { ROUTES, APP_CONFIG, API_ENDPOINTS } from '@smart/lib/constants';
import { QrLoginModal } from '@smart/components/auth/QrLoginModal';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || ROUTES.HOME;

  const { login: storeLogin, setAccessToken, setLoading } = useAuthStore();
  const { setCurrentUser, setUserInitialized } = useUserStore();
  const { addNotification } = useNotificationStore();
  const { theme, setTheme, resolvedTheme } = useBoardStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLocalLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [needsVerified, setNeedsVerified] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleVerify = async () => {
    if (!otp) {
      addNotification('Vui lòng nhập mã OTP', 'error');
      return;
    }

    try {
      setLocalLoading(true);
      const res = await authService.verifyEmail({ email, code: otp });
      if (res.success) {
        addNotification('Xác thực email thành công! Vui lòng đăng nhập lại.', 'success');
        setNeedsVerified(false);
        setOtp('');
      } else {
        addNotification(res.message || 'Mã xác thực không chính xác', 'error');
      }
    } catch (err: any) {
      addNotification(err.message || 'Lỗi xác thực', 'error');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await authService.resendCode(email);
      addNotification('Đã gửi lại mã OTP vào email của bạn', 'success');
    } catch (err: any) {
      addNotification('Không thể gửi lại mã lúc này', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      addNotification('Vui lòng nhập email và mật khẩu', 'error');
      return;
    }

    try {
      setLocalLoading(true);
      setLoading(true);

      const res = await authService.login({ email, password });
      
      if (!res.success) {
        if (res.data?.needsVerified) {
          setNeedsVerified(true);
          addNotification('Tài khoản chưa được xác thực. Vui lòng nhập mã OTP đã gửi đến email của bạn.', 'info');
          return;
        }
        addNotification(res.message || 'Email hoặc mật khẩu không chính xác', 'error');
        return;
      }

      const accessToken = res.data?.accessToken;
      const user = res.data?.user;

      if (!accessToken || !user) {
        addNotification('Dữ liệu đăng nhập không hợp lệ', 'error');
        return;
      }

      storeLogin(accessToken);
      setAccessToken(accessToken);
      setCurrentUser(user);
      setUserInitialized(true);

      addNotification('Đăng nhập thành công', 'success', true, 3000);
      router.push(redirectTo);
    } catch (err: any) {
      addNotification(err.message || 'Đăng nhập không thành công', 'error');
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent font-sans relative">
      {/* Theme Toggle Button */}
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
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            {needsVerified ? 'Xác thực tài khoản' : 'Đăng nhập'}
          </h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {needsVerified ? 'Vui lòng nhập mã OTP đã được gửi đến email của bạn' : 'Chào mừng bạn quay trở lại!'}
          </p>
        </div>

        <div className="space-y-4">
          {!needsVerified ? (
            <>
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-gray-500 uppercase ml-1">Email</label>
                <Input
                  prefix={<UserOutlined className="text-blue-500" />}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="large"
                  className="h-11 rounded-xl bg-white/50 dark:bg-black/50 border-blue-100/50 dark:border-white/10"
                />
              </div>
    
              <div className="space-y-1 relative">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] font-bold text-gray-500 uppercase ml-1">Mật khẩu</label>
                  <Link href="/auth/forgot-password" className="text-[11px] font-bold text-blue-600 hover:text-blue-500 transition-colors uppercase">
                    Quên mật khẩu?
                  </Link>
                </div>
                <Input.Password
                  prefix={<LockOutlined className="text-blue-500" />}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                className="h-11 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none font-bold text-sm shadow-lg shadow-blue-500/25"
              >
                ĐĂNG NHẬP
              </Button>
            </>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-gray-500 uppercase ml-1 text-center block">Mã xác thực (OTP)</label>
                <Input
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  size="large"
                  className="h-12 rounded-xl text-center text-2xl font-black tracking-[0.5em] bg-white/50 dark:bg-black/50 border-blue-100/50 dark:border-white/10"
                  maxLength={6}
                />
              </div>

              <div className="space-y-3">
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleVerify}
                  loading={loading}
                  className="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none font-bold text-sm shadow-lg shadow-blue-500/25"
                >
                  XÁC THỰC NGAY
                </Button>
                <Button
                  type="text"
                  block
                  onClick={handleResendOtp}
                  className="text-blue-600 font-bold text-xs"
                >
                  Gửi lại mã OTP
                </Button>
                <Button
                  type="link"
                  block
                  onClick={() => setNeedsVerified(false)}
                  className="text-gray-500 text-xs"
                >
                  Quay lại đăng nhập
                </Button>
              </div>
            </div>
          )}

          {!needsVerified && (
            <>
              <Divider className="border-blue-100/50 dark:border-white/5 text-gray-400 text-[10px] uppercase font-bold my-6">hoặc</Divider>
    
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.location.href = `${APP_CONFIG.API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`}
                  className="h-11 rounded-xl flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 border border-blue-100/50 dark:border-white/10 font-semibold text-sm transition-all hover:bg-white dark:hover:bg-neutral-800 active:scale-95 text-gray-900 dark:text-white"
                >
                  <GoogleOutlined className="text-red-500 mr-2" /> Google
                </button>
                <button
                  onClick={() => setQrModalOpen(true)}
                  className="h-11 rounded-xl flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 border border-blue-100/50 dark:border-white/10 font-semibold text-sm transition-all hover:bg-white dark:hover:bg-neutral-800 active:scale-95 text-gray-900 dark:text-white"
                >
                  <QrcodeOutlined className="text-blue-500 mr-2" /> QR Code
                </button>
              </div>
    
              <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
                Chưa có tài khoản?{' '}
                <Link href="/auth/register" className="text-blue-600 font-bold hover:text-blue-500 transition-colors">
                  Đăng ký ngay
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>

      <QrLoginModal open={qrModalOpen} onCancel={() => setQrModalOpen(false)} />
    </div>
  );
}
