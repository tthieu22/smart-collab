'use client';

import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import AuthBackground from '@smart/components/auth/AuthBackground';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalLoadingProps {
  loading: boolean;
  text?: string;
}

export default function GlobalLoading({ loading, text = 'Đang kết nối trạm điều hành...' }: GlobalLoadingProps) {
  const antIcon = <LoadingOutlined style={{ fontSize: 40 }} spin />;

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        >
          {/* Background identical to Login */}
          <AuthBackground />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/60 dark:bg-neutral-900/80 backdrop-blur-2xl p-10 rounded-[32px] border border-white/40 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(59,130,246,0.15)] flex flex-col items-center"
            >
              <Spin indicator={antIcon} className="text-blue-600 dark:text-blue-400" />
              <div className="mt-6 flex flex-col items-center">
                <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white m-0">Smart Collab</h3>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mt-2 font-medium italic animate-pulse">
                  {text}
                </p>
              </div>
            </motion.div>
          </div>

          <style jsx global>{`
            html, body { overflow: hidden !important; }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
