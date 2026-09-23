'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Zap, Server, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@smart/lib/utils';

export function DemoNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Kiểm tra xem người dùng đã đóng và chọn không hiển thị lại chưa
    const isDismissed = localStorage.getItem('smart_collab_demo_notice_dismissed');
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Cho phép kích hoạt mở lại modal thông qua window event bất cứ lúc nào
    const handleTrigger = () => setIsOpen(true);
    window.addEventListener('open-demo-notice', handleTrigger);
    return () => window.removeEventListener('open-demo-notice', handleTrigger);
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('smart_collab_demo_notice_dismissed', 'true');
    }
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={cn(
              "relative w-full max-w-xl overflow-hidden rounded-3xl border shadow-2xl z-10",
              "bg-white dark:bg-[#13141c] border-gray-200 dark:border-gray-800/80 text-gray-900 dark:text-gray-100"
            )}
          >
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={handleClose}
              className={cn(
                "absolute top-4 right-4 p-2 rounded-full transition-all duration-200 z-20",
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800/60"
              )}
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-7 space-y-5">
              {/* Header Badge & Title */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10">
                  <Server size={24} />
                </div>

                <div className="flex-1 pr-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Phiên Bản Demo / MVP
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Thông Báo Phiên Bản Trải Nghiệm
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Hệ thống đang hoạt động dưới dạng bản rút gọn để triển khai thử nghiệm
                  </p>
                </div>
              </div>

              {/* Informative Note Box */}
              <div className="space-y-3">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1b24] border border-gray-100 dark:border-gray-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                    <Layers size={16} />
                    <span>Kiến trúc tối giản (Lite Architecture)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Dự án hiện tại là phiên bản <strong className="font-semibold text-gray-900 dark:text-white">Demo</strong> được tối ưu hóa. Toàn bộ các dịch vụ microservices phức tạp của dự án gốc đã được tinh giản và gom cụm để triển khai nhanh chóng và tiết kiệm tài nguyên.
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1b24] border border-gray-100 dark:border-gray-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    <Zap size={16} />
                    <span>Phạm vi tính năng demo</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Tập trung thể hiện các luồng nghiệp vụ cốt lõi: Bảng tin xã hội, Quản lý dự án (Kanban Board), Lịch trình, Trò chuyện và Trợ lý AI. Một số dịch vụ phân tán nặng và tác vụ ngầm nâng cao được giản lược so với bản gốc.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-t border-gray-100 dark:border-gray-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-gray-500 dark:text-gray-400 select-none hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                  />
                  <span>Không hiển thị lại lần sau</span>
                </label>

                <button
                  onClick={handleClose}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white",
                    "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
                    "shadow-lg shadow-blue-500/25 active:scale-95 transition-all duration-150"
                  )}
                >
                  <span>Đã hiểu & Tiếp tục</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default DemoNoticeModal;
