"use client";

import React, { useRef } from "react";
import { Button } from "antd";
import { LockOutlined, ArrowRightOutlined, UserAddOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useBoardStore } from "@smart/store/setting";

interface LoginOverlayProps {
  title: string;
  description: string;
}

export default function LoginOverlay({ title, description }: LoginOverlayProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useBoardStore((s) => s.resolvedTheme);
  const isDark = theme === "dark";

  // Mouse interaction values for subtle 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`absolute inset-0 z-[100] flex flex-col items-center justify-center p-4 overflow-hidden transition-colors duration-500 font-sans login-overlay-container
        ${isDark ? 'bg-[#0f1015]' : 'bg-[#f8fafc]'}
      `}
    >
      {/* 1. Base Gradient */}
      <div className={`absolute inset-0 transition-opacity duration-1000 
        ${isDark 
          ? 'bg-[radial-gradient(circle_at_center,_rgba(24,28,45,1)_0%,_rgba(15,16,21,1)_100%)] opacity-100' 
          : 'bg-[radial-gradient(circle_at_center,_rgba(238,242,255,1)_0%,_rgba(248,250,252,1)_100%)] opacity-100'
        }
      `} />

      {/* 2. Soft Ambient Blobs */}
      <div 
        className={`absolute top-[-10%] right-[-10%] w-[55%] h-[55%] blur-[120px] rounded-full pointer-events-none
          ${isDark ? 'bg-blue-600/15' : 'bg-blue-400/15'}
        `} 
      />
      <div 
        className={`absolute bottom-[-10%] left-[-10%] w-[55%] h-[55%] blur-[120px] rounded-full pointer-events-none
          ${isDark ? 'bg-indigo-600/15' : 'bg-indigo-300/20'}
        `} 
      />

      {/* 3. CONTENT CARD */}
      <motion.div 
        style={{ 
          rotateX: useTransform(springY, [0, 800], [3, -3]),
          rotateY: useTransform(springX, [0, 800], [-3, 3]),
        }}
        className="relative z-10 flex flex-col items-center w-full max-w-[320px] perspective-[1000px] p-6 rounded-3xl bg-white/70 dark:bg-[#181924]/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800 shadow-xl"
      >
        {/* Floating Lock Icon */}
        <div className="mb-4 relative">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border
            ${isDark ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 border-white/10 shadow-blue-500/30' : 'bg-white border-blue-100 shadow-blue-200/40'}
          `}>
            <LockOutlined className={`text-2xl ${isDark ? 'text-white' : 'text-blue-600'}`} />
          </div>
        </div>

        {/* Title */}
        <h2 className={`text-lg font-bold mb-2 tracking-tight text-center
          ${isDark ? 'text-white' : 'text-gray-900'}
        `}>
          {title}
        </h2>
        
        {/* Description */}
        <p className={`text-[12px] mb-6 leading-relaxed text-center font-normal px-1
          ${isDark ? 'text-gray-400' : 'text-gray-500'}
        `}>
          {description}
        </p>

        <div className="w-full space-y-3">
          <Button 
            type="primary" 
            size="large"
            block
            icon={<ArrowRightOutlined />}
            onClick={() => router.push("/auth/login")}
            className="h-11 border-none rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            Đăng nhập ngay
          </Button>
          
          <button 
            onClick={() => router.push("/auth/register")}
            className={`w-full text-xs font-semibold py-2 transition-colors flex items-center justify-center gap-1.5 group
              ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
            `}
          >
            <UserAddOutlined className="text-xs" />
            Tạo tài khoản miễn phí
          </button>
        </div>
      </motion.div>
    </div>
  );
}
