"use client";
 
 import React, { useMemo, useEffect } from "react";
 import { useTheme } from "next-themes";
 import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
 
 export default function AuthBackground() {
   const { resolvedTheme } = useTheme();
   const isDark = resolvedTheme === "dark";
 
   // Mouse tracking for subtle parallax hull vibration
   const mouseX = useMotionValue(0);
   const mouseY = useMotionValue(0);
   const springX = useSpring(mouseX, { damping: 40, stiffness: 80 });
   const springY = useSpring(mouseY, { damping: 40, stiffness: 80 });
 
   // Stars Parallax
   const starsX = useTransform(springX, [0, 1920], [30, -30]);
   const starsY = useTransform(springY, [0, 1080], [30, -30]);
 
   useEffect(() => {
     const handleMouseMove = (e: MouseEvent) => {
       mouseX.set(e.clientX);
       mouseY.set(e.clientY);
     };
     window.addEventListener("mousemove", handleMouseMove);
     return () => window.removeEventListener("mousemove", handleMouseMove);
   }, []);
 
   // Warp Field: Moving forward at high speed
   const warpStars = useMemo(() => [...Array(150)].map((_, i) => ({
     id: i,
     x: Math.random() * 100,
     y: Math.random() * 100,
     size: Math.random() * 2 + 0.8,
     duration: 1.0 + Math.random() * 3.0, // Fast speed
     delay: Math.random() * 10
   })), []);
 
   return (
     <div className={`fixed inset-0 z-0 overflow-hidden transition-colors duration-1000 pointer-events-none
       ${isDark ? 'bg-[#010206]' : 'bg-[#f0f4ff]'}
     `}>
       {/* 1. Base Space Gradient */}
       <div className={`absolute inset-0 transition-opacity duration-1000 
         ${isDark 
           ? 'bg-[radial-gradient(circle_at_center,_rgba(10,20,60,1)_0%,_rgba(1,2,6,1)_100%)]' 
           : 'bg-[radial-gradient(circle_at_center,_rgba(215,225,255,1)_0%,_rgba(240,244,255,1)_100%)]'
         }
       `} />
 
       {/* 2. Warp Field (3D Star Tunnel) */}
       <div className="absolute inset-0 perspective-[1000px]">
         {warpStars.map((star) => (
           <motion.div
             key={star.id}
             initial={{ z: -1000, opacity: 0 }}
             animate={{ 
               z: [0, 2000], 
               opacity: [0, 1, 1, 0],
               scale: [1, 2.5, 0]
             }}
             transition={{ 
               duration: star.duration, 
               repeat: Infinity, 
               delay: star.delay, 
               ease: "easeIn" 
             }}
             className={`absolute rounded-full
               ${isDark ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'}
             `}
             style={{
               width: star.size + "px",
               height: star.size + "px",
               left: star.x + "%",
               top: star.y + "%",
             }}
           />
         ))}
       </div>
 
       {/* 3. Nebula Passing Glow */}
       <motion.div 
         animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
         transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
         className={`absolute inset-0 opacity-20 blur-[120px]
           ${isDark ? 'bg-[radial-gradient(circle_at_70%_30%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]' : 'bg-[radial-gradient(circle_at_70%_30%,_rgba(59,130,246,0.1)_0%,_transparent_50%)]'}
         `} 
       />
 
       {/* 4. Hull Dust (Subtle Static Stars for Parallax) */}
       <motion.div 
         style={{ x: starsX, y: starsY }}
         className="absolute inset-0 pointer-events-none"
       >
         {[...Array(50)].map((_, i) => (
           <motion.div
             key={i}
             animate={{ opacity: [0.2, 0.8, 0.2] }}
             transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 5 }}
             className={`absolute rounded-full ${isDark ? 'bg-white/50' : 'bg-blue-500/50'}`}
             style={{
               width: "1.2px",
               height: "1.2px",
               top: Math.random() * 100 + "%",
               left: Math.random() * 100 + "%",
             }}
           />
         ))}
       </motion.div>
     </div>
   );
 }
