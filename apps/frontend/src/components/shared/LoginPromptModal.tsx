'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogIn, UserPlus, X, ShieldAlert } from 'lucide-react';
import { cn } from '@smart/lib/utils';

export function LoginPromptModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [promptMessage, setPromptMessage] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    let lastPromptTime = 0;

    const handleRequireLogin = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string; endpoint?: string }>;
      // Không hiển thị nếu đang ở các trang auth (login, register...)
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')) {
        return;
      }

      const now = Date.now();
      // Chống spam modal nếu nhiều API cùng trả về 401 một lúc
      if (now - lastPromptTime < 2500) {
        return;
      }
      lastPromptTime = now;

      if (customEvent.detail?.message) {
        setPromptMessage(customEvent.detail.message);
      } else {
        setPromptMessage('Bạn cần đăng nhập để thực hiện thao tác này và truy cập đầy đủ các tính năng.');
      }

      setIsOpen(true);
    };

    window.addEventListener('auth:require-login', handleRequireLogin);
    return () => window.removeEventListener('auth:require-login', handleRequireLogin);
  }, []);

  const handleGoLogin = () => {
    setIsOpen(false);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleGoRegister = () => {
    setIsOpen(false);
    router.push('/auth/register');
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className={cn(
              "relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl z-10",
              "bg-white dark:bg-[#15161e] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100"
            )}
          >
            {/* Top decorative gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className={cn(
                "absolute top-4 right-4 p-2 rounded-full transition-all duration-200 z-20",
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-7 space-y-5 text-center">
              {/* Icon Container */}
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/10">
                <Lock size={26} />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                  <ShieldAlert size={13} />
                  Yêu Cầu Xác Thực
                </div>
                <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Vui lòng đăng nhập
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed px-2">
                  {promptMessage}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleGoLogin}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white",
                    "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
                    "shadow-lg shadow-blue-500/25 active:scale-95 transition-all duration-150"
                  )}
                >
                  <LogIn size={18} />
                  <span>Đăng nhập ngay</span>
                </button>

                <button
                  onClick={handleGoRegister}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm",
                    "border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-50 dark:hover:bg-gray-800/60 active:scale-95 transition-all duration-150"
                  )}
                >
                  <UserPlus size={16} />
                  <span>Tạo tài khoản mới</span>
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors pt-1"
                >
                  Để sau
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default LoginPromptModal;
