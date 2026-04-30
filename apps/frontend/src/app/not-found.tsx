"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import AuthBackground from "@smart/components/auth/AuthBackground";
import { useTheme } from "next-themes";
import { cn } from "@smart/lib/utils";

export default function NotFound() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={cn(
      "fixed inset-0 z-[9999] w-full h-full overflow-hidden flex flex-col items-center justify-center transition-colors duration-1000 bg-transparent",
      isDark ? "text-white" : "text-gray-900"
    )}>
      {/* Dynamic Background (Sky for Light, Space for Dark) */}
      <AuthBackground />

      {/* 404 Content Layer */}
      <div className="relative z-10 text-center px-6 max-w-3xl flex flex-col items-center justify-center">
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className={cn(
            "text-8xl md:text-[10rem] font-black tracking-tighter leading-none mb-6 select-none bg-clip-text text-transparent",
            isDark 
              ? "bg-gradient-to-b from-white via-white/80 to-blue-500/50 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
              : "bg-gradient-to-b from-blue-600 via-blue-400 to-blue-200 drop-shadow-[0_0_30px_rgba(59,130,246,0.1)]"
          )}
        >
          404
        </motion.h1>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="space-y-3"
        >
          <h2 className={cn(
            "text-2xl md:text-3xl font-bold tracking-tight",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {isDark ? "Bạn đang trôi dạt trong vô định..." : "Bạn đã bay lạc tới tầng mây khác..."}
          </h2>
          <p className={cn(
            "text-sm md:text-base max-w-lg mx-auto mb-10 leading-relaxed font-medium",
            isDark ? "text-blue-100/60" : "text-gray-500"
          )}>
            Tín hiệu từ trang bạn yêu cầu đã biến mất. 
            Đừng hoảng loạn, hãy điều hướng về căn cứ an toàn để tiếp tục công việc.
          </p>
        </motion.div>

        {/* Action Buttons Layer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 30px rgba(59, 130, 246, 0.4)" : "0 10px 20px rgba(0,0,0,0.05)" }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "group relative px-8 py-3 font-bold rounded-full flex items-center gap-3 transition-all",
                isDark ? "bg-white text-black" : "bg-blue-600 text-white"
              )}
            >
              <Home size={18} />
              Trở về Căn Cứ
            </motion.button>
          </Link>

          <button
            onClick={() => window.history.back()}
            className={cn(
              "px-8 py-3 font-semibold rounded-full border backdrop-blur-xl flex items-center gap-3 transition-all",
              isDark 
                ? "bg-white/5 hover:bg-white/10 text-white border-white/10" 
                : "bg-gray-100/50 hover:bg-gray-100 text-gray-700 border-gray-200"
            )}
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </motion.div>
      </div>

      {/* Global Brand Label */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10 pointer-events-none">
        <div className={cn(
          "flex items-center justify-center gap-2 text-[9px] tracking-[0.4em] uppercase font-bold opacity-30",
          isDark ? "text-white" : "text-gray-400"
        )}>
          <span className={cn("w-6 h-[1px]", isDark ? "bg-white/20" : "bg-gray-200")}></span>
          {isDark ? "Deep Space Explorer" : "Cloud Horizon Network"}
          <span className={cn("w-6 h-[1px]", isDark ? "bg-white/20" : "bg-gray-200")}></span>
        </div>
      </div>
    </div>
  );
}

