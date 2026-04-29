'use client';
 
 import { useState } from 'react';
 import Link from 'next/link';
 import { useRouter, useSearchParams } from 'next/navigation';
 import { UserOutlined, LockOutlined, GoogleOutlined, QrcodeOutlined } from '@ant-design/icons';
 import { Input, Button, Divider } from 'antd';
 import { authService } from '@smart/services/auth.service';
 import { useAuthStore } from '@smart/store/auth';
 import { useUserStore } from '@smart/store/user';
 import { useNotificationStore } from '@smart/store/notification';
 import { ROUTES, APP_CONFIG, API_ENDPOINTS } from '@smart/lib/constants';
 import { QrLoginModal } from '@smart/components/auth/QrLoginModal';
 import { motion } from 'framer-motion';
 
 export default function LoginPage() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const redirectTo = searchParams.get('redirect') || ROUTES.DASHBOARD;
 
   const { login: storeLogin, setAccessToken, setLoading } = useAuthStore();
   const { setCurrentUser, setUserInitialized } = useUserStore();
   const { addNotification } = useNotificationStore();
 
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLocalLoading] = useState(false);
   const [qrModalOpen, setQrModalOpen] = useState(false);
 
   const handleSubmit = async () => {
     if (!email || !password) {
       addNotification('Vui lòng nhập email và mật khẩu', 'error');
       return;
     }
 
     try {
       setLocalLoading(true);
       setLoading(true);
 
       const res = await authService.login({ email, password });
       const accessToken = res.data?.accessToken;
       const user = res.data?.user;
 
       if (!res.success || !accessToken || !user) {
         addNotification(res.message || 'Email hoặc mật khẩu không chính xác', 'error');
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
     <div className="min-h-screen flex items-center justify-center p-6 bg-transparent font-sans">
       <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="w-full max-w-[450px] bg-white/10 dark:bg-black/40 backdrop-blur-2xl rounded-[40px] border border-white/20 p-8 md:p-10 shadow-2xl z-10"
       >
         <div className="text-center mb-8">
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Đăng nhập</h2>
           <p className="text-sm text-gray-500 dark:text-gray-400">Chào mừng bạn quay trở lại!</p>
         </div>
 
         <div className="space-y-4">
           <div className="space-y-1">
             <label className="text-[12px] font-bold text-gray-500 uppercase ml-1">Email</label>
             <Input
               prefix={<UserOutlined className="text-blue-500" />}
               placeholder="your@email.com"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               size="large"
               className="h-11 rounded-xl bg-white/50 dark:bg-black/50 border-white/20"
             />
           </div>
 
           <div className="space-y-1">
             <label className="text-[12px] font-bold text-gray-500 uppercase ml-1">Mật khẩu</label>
             <Input.Password
               prefix={<LockOutlined className="text-blue-500" />}
               placeholder="••••••••"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               size="large"
               className="h-11 rounded-xl bg-white/50 dark:bg-black/50 border-white/20"
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
 
           <Divider className="border-white/10 text-gray-400 text-[10px] uppercase font-bold my-6">hoặc</Divider>
 
           <div className="grid grid-cols-2 gap-3">
             <button
               onClick={() => window.location.href = `${APP_CONFIG.API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`}
               className="h-11 rounded-xl flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 border border-white/10 font-semibold text-sm transition-all hover:bg-white active:scale-95"
             >
               <GoogleOutlined className="text-red-500 mr-2" /> Google
             </button>
             <button
               onClick={() => setQrModalOpen(true)}
               className="h-11 rounded-xl flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 border border-white/10 font-semibold text-sm transition-all hover:bg-white active:scale-95"
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
         </div>
       </motion.div>
 
       <QrLoginModal open={qrModalOpen} onCancel={() => setQrModalOpen(false)} />
     </div>
   );
 }
