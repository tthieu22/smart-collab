'use client';
 
 import { useState } from 'react';
 import { useRouter, useSearchParams } from 'next/navigation';
 import { Form, Input, Button } from 'antd';
 import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
 import Link from 'next/link';
 import { authService } from '@smart/services/auth.service';
 import { ApiResponse, RegisterRequest } from '@smart/types/auth';
 import { useNotificationStore } from '@smart/store/notification';
 import { motion } from 'framer-motion';
 
 export default function RegisterPage() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const [loading, setLoading] = useState(false);
   const { addNotification } = useNotificationStore();
 
   const onFinish = async (values: any) => {
     try {
       setLoading(true);
       if (values.password !== values.confirmPassword) {
         addNotification('Mật khẩu xác nhận không khớp', 'error');
         setLoading(false);
         return;
       }
 
       const payload: RegisterRequest = {
         firstName: values.firstName,
         lastName: values.lastName,
         email: values.email,
         password: values.password,
       };
       const res: ApiResponse = await authService.register(payload);
 
       if (res.success === false) {
         addNotification(res.message || 'Đăng ký không thành công', 'error');
       } else {
         addNotification('Đăng ký thành công! Hãy đăng nhập.', 'success');
         const searchStr = searchParams.toString();
         router.push(`/auth/login${searchStr ? `?${searchStr}` : ''}`);
       }
     } catch (err: any) {
       addNotification(err.message || 'Đăng ký không thành công', 'error');
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div className="min-h-screen flex items-center justify-center p-6 bg-transparent font-sans">
       <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="w-full max-w-[450px] bg-white/70 dark:bg-black/60 backdrop-blur-[10px] rounded-[16px] border border-white/40 dark:border-white/10 p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl z-10"
       >
         <div className="text-center mb-8">
           <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Đăng ký</h2>
           <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bắt đầu hành trình cộng tác mới của bạn</p>
         </div>
 
         <Form
           name="register"
           onFinish={onFinish}
           layout="vertical"
           className="space-y-4"
         >
           <div className="grid grid-cols-2 gap-4">
             <Form.Item name="firstName" rules={[{ required: true, message: 'Nhập tên!' }]}>
               <Input prefix={<UserOutlined className="text-blue-500" />} placeholder="Tên" size="large" className="h-11 rounded-xl bg-white/50 dark:bg-black/50 border-blue-100/50 dark:border-white/10" />
             </Form.Item>
             <Form.Item name="lastName" rules={[{ required: true, message: 'Nhập họ!' }]}>
               <Input prefix={<UserOutlined className="text-blue-500" />} placeholder="Họ" size="large" className="h-11 rounded-xl bg-white/50 dark:bg-black/50 border-blue-100/50 dark:border-white/10" />
             </Form.Item>
           </div>
 
           <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
             <Input prefix={<MailOutlined className="text-blue-500" />} placeholder="Email" size="large" className="h-11 rounded-xl bg-white/50 dark:bg-black/50 border-blue-100/50 dark:border-white/10" />
           </Form.Item>
 
           <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }]}>
             <Input.Password prefix={<LockOutlined className="text-blue-500" />} placeholder="Mật khẩu" size="large" className="h-11 rounded-xl bg-white/50 dark:bg-black/50 border-blue-100/50 dark:border-white/10" />
           </Form.Item>
 
           <Form.Item name="confirmPassword" rules={[{ required: true, message: 'Xác nhận lại mật khẩu!' }]}>
             <Input.Password prefix={<LockOutlined className="text-blue-500" />} placeholder="Xác nhận mật khẩu" size="large" className="h-11 rounded-xl bg-white/50 dark:bg-black/50 border-blue-100/50 dark:border-white/10" />
           </Form.Item>
 
           <Form.Item>
             <Button
               type="primary"
               htmlType="submit"
               size="large"
               block
               loading={loading}
               className="h-11 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none font-bold text-sm shadow-lg shadow-blue-500/25"
             >
               ĐĂNG KÝ
             </Button>
           </Form.Item>
         </Form>
 
         <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
           Đã có tài khoản?{' '}
           <Link href="/auth/login" className="text-blue-600 font-bold hover:text-blue-500 transition-colors">
             Đăng nhập ngay
           </Link>
         </p>
       </motion.div>
     </div>
   );
 }
