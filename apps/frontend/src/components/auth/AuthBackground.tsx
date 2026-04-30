"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export default function AuthBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- LIGHT MODE: Cloud Logic (Hiển thị cực rõ) ---
  const clouds = useMemo(() => [
    { id: 1, w: "w-[500px]", h: "h-[250px]", top: "top-10", left: "left-[-10%]", duration: 50, delay: 0 },
    { id: 2, w: "w-[700px]", h: "h-[350px]", top: "top-1/4", left: "left-[-20%]", duration: 70, delay: -15 },
    { id: 3, w: "w-[600px]", h: "h-[300px]", top: "top-1/2", left: "left-[-15%]", duration: 60, delay: -30 },
  ], []);

  if (!mounted) return null;

  if (isDark) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#010206] pointer-events-none">
        {/* Layer 1: Base Space */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(10,20,60,1)_0%,_rgba(1,2,6,1)_100%)]" />
        
        {/* Layer 2: Effect (Warp) */}
        <div className="absolute inset-0 perspective-[1000px] opacity-40">
          {[...Array(60)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ z: -1000, opacity: 0 }}
              animate={{ z: [0, 2000], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 10, ease: "easeIn" }}
              className="absolute rounded-full bg-white"
              style={{ 
                width: "1.5px", height: "1.5px", 
                left: Math.random() * 100 + "%", 
                top: Math.random() * 100 + "%" 
              }}
            />
          ))}
        </div>

        {/* Layer 3: Overlay Protection */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      </div>
    );
  }

  // --- LIGHT MODE: CHẾ ĐỘ HIỂN THỊ CAO ---
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-white pointer-events-none">
      {/* LỚP 1: BASE BACKGROUND (Xanh rõ rệt) */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #87ceeb 0%, #b3e5fc 50%, #ffffff 100%)'
        }}
      />

      {/* LỚP 2: EFFECT LAYER (Mây đậm nét) */}
      <div className="absolute inset-0 overflow-hidden">
        {clouds.map((cloud) => (
          <motion.div
            key={cloud.id}
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ 
              duration: cloud.duration, 
              repeat: Infinity, 
              ease: "linear", 
              delay: cloud.delay 
            }}
            className={`${cloud.w} ${cloud.h} ${cloud.top} ${cloud.left} absolute bg-white rounded-full opacity-[0.6] blur-[15px] shadow-[0_20px_50px_rgba(255,255,255,0.5)]`}
          />
        ))}

        {/* Sun Glow */}
        <div 
          className="absolute -top-[100px] -right-[100px] w-[500px] h-[500px] opacity-[0.4] blur-[60px]"
          style={{ background: 'radial-gradient(circle, #fff3b0, transparent)' }}
        />
      </div>

      {/* LỚP 3: OVERLAY (Gần như trong suốt để hiện mây) */}
      <div 
        className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px]"
      />

      {/* Noise layer (Pro tip để tránh bị flat) */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
    </div>
  );
}







