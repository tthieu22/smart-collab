"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Rocket } from "lucide-react";
import AuthBackground from "@smart/components/auth/AuthBackground";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[9999] w-full h-full overflow-hidden flex flex-col items-center justify-center text-white bg-[#010206]">
      {/* Background with Cosmic Warp Effect */}
      <AuthBackground />

      {/* 404 Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl flex flex-col items-center justify-center">
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="text-8xl md:text-[10rem] font-black tracking-tighter leading-none mb-6 select-none bg-clip-text text-transparent bg-gradient-to-b from-white via-white/80 to-blue-500/50 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          404
        </motion.h1>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="space-y-3"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Bạn đang trôi dạt trong vô định...
          </h2>
          <p className="text-blue-100/60 text-sm md:text-base max-w-lg mx-auto mb-10 leading-relaxed font-medium">
            Tín hiệu từ trang bạn yêu cầu đã biến mất sau lỗ đen vũ trụ. 
            Đừng hoảng loạn, hãy điều hướng về căn cứ an toàn.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-3 bg-white text-black font-bold rounded-full flex items-center gap-3 transition-all"
            >
              <Home size={18} />
              Trở về Căn Cứ
            </motion.button>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full border border-white/10 backdrop-blur-xl flex items-center gap-3 transition-all"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </motion.div>
      </div>

      {/* Global Brand Label */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10 pointer-events-none">
        <div className="flex items-center justify-center gap-2 text-white/20 text-[9px] tracking-[0.4em] uppercase font-bold">
          <span className="w-6 h-[1px] bg-white/10"></span>
          Smart Collab Deep Space Explorer
          <span className="w-6 h-[1px] bg-white/10"></span>
        </div>
      </div>
    </div>
  );
}
