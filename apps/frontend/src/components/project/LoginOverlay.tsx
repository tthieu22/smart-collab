"use client";
 
 import React, { useMemo, useRef } from "react";
 import { Button } from "antd";
 import { RocketOutlined, GlobalOutlined, StarFilled } from "@ant-design/icons";
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
 
   // Mouse interaction values for parallax only
   const mouseX = useMotionValue(0);
   const mouseY = useMotionValue(0);
 
   const springConfig = { damping: 25, stiffness: 150 };
   const springX = useSpring(mouseX, springConfig);
   const springY = useSpring(mouseY, springConfig);
 
   // Parallax transforms
   const nebula1X = useTransform(springX, [0, 800], [30, -30]);
   const nebula1Y = useTransform(springY, [0, 800], [30, -30]);
   const nebula2X = useTransform(springX, [0, 800], [-50, 50]);
   const nebula2Y = useTransform(springY, [0, 800], [-50, 50]);
   const starsX = useTransform(springX, [0, 800], [10, -10]);
   const starsY = useTransform(springY, [0, 800], [10, -10]);
 
   const handleMouseMove = (e: React.MouseEvent) => {
     if (!containerRef.current) return;
     const rect = containerRef.current.getBoundingClientRect();
     mouseX.set(e.clientX - rect.left);
     mouseY.set(e.clientY - rect.top);
   };
 
   // Static stars
   const stars = useMemo(() => [...Array(40)].map((_, i) => ({
     id: i,
     size: Math.random() * 2 + 0.5,
     top: Math.random() * 100 + "%",
     left: Math.random() * 100 + "%",
     duration: 2 + Math.random() * 2,
     delay: Math.random() * 5
   })), []);
 
   // Meteors
   const meteors = useMemo(() => [...Array(4)].map((_, i) => ({
     id: i,
     top: Math.random() * 50 + "%",
     left: Math.random() * 100 + "%",
     delay: Math.random() * 10,
     duration: 1.2 + Math.random() * 1.8
   })), []);
 
   return (
     <div 
       ref={containerRef}
       onMouseMove={handleMouseMove}
       className={`absolute inset-0 z-[100] flex flex-col items-center justify-center p-4 overflow-hidden transition-colors duration-500 font-sans login-overlay-container
         ${isDark ? 'bg-[#03040a]' : 'bg-[#f0f4ff]'}
       `}
     >
       {/* 1. Base Gradient */}
       <div className={`absolute inset-0 transition-opacity duration-1000 
         ${isDark 
           ? 'bg-[radial-gradient(circle_at_center,_rgba(15,20,50,1)_0%,_rgba(3,4,10,1)_100%)] opacity-100' 
           : 'bg-[radial-gradient(circle_at_center,_rgba(224,231,255,1)_0%,_rgba(240,244,255,1)_100%)] opacity-100'
         }
       `} />
 
       {/* 2. Interactive Mouse Glow */}
       <motion.div 
         className={`absolute w-[450px] h-[450px] rounded-full blur-[90px] pointer-events-none z-0
           ${isDark ? 'bg-blue-500/10' : 'bg-blue-400/15'}
         `}
         style={{ 
           x: useTransform(springX, (val) => val - 225), 
           y: useTransform(springY, (val) => val - 225) 
         }}
       />
 
       {/* 3. Nebula Blobs */}
       <motion.div 
         style={{ x: nebula1X, y: nebula1Y }}
         className={`absolute top-[-5%] right-[-5%] w-[75%] h-[75%] blur-[110px] rounded-full pointer-events-none
           ${isDark ? 'bg-blue-600/15' : 'bg-blue-400/10'}
         `} 
       />
       <motion.div 
         style={{ x: nebula2X, y: nebula2Y }}
         className={`absolute bottom-[-5%] left-[-5%] w-[65%] h-[65%] blur-[110px] rounded-full pointer-events-none
           ${isDark ? 'bg-purple-600/15' : 'bg-purple-300/10'}
         `} 
       />
 
       {/* 4. Twinkling Stars */}
       <motion.div 
         style={{ x: starsX, y: starsY }}
         className="absolute inset-[-30px] pointer-events-none"
       >
         {stars.map((star) => (
           <motion.div
             key={star.id}
             animate={{ opacity: [0.3, 1, 0.3] }}
             transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }}
             className={`absolute rounded-full
               ${isDark ? 'bg-white shadow-[0_0_4px_rgba(255,255,255,0.7)]' : 'bg-blue-600 shadow-[0_0_3px_rgba(37,99,235,0.3)]'}
             `}
             style={{
               width: star.size + "px",
               height: star.size + "px",
               top: star.top,
               left: star.left,
             }}
           />
         ))}
       </motion.div>
 
       {/* 5. Shooting Stars */}
       {meteors.map((meteor) => (
         <motion.div
           key={meteor.id}
           initial={{ x: 0, y: 0, opacity: 0 }}
           animate={{ x: [0, -450], y: [0, 450], opacity: [0, 1, 0] }}
           transition={{ duration: meteor.duration, repeat: Infinity, delay: meteor.delay, ease: "easeIn" }}
           className={`absolute w-[1.5px] h-[80px] rounded-full rotate-45 pointer-events-none
             ${isDark ? 'bg-gradient-to-t from-transparent via-white/50 to-white' : 'bg-gradient-to-t from-transparent via-blue-400/50 to-blue-600'}
           `}
           style={{ top: meteor.top, left: meteor.left }}
         />
       ))}
 
       {/* --- CONTENT SECTION --- */}
       
       <motion.div 
         style={{ 
           rotateX: useTransform(springY, [0, 800], [3, -3]),
           rotateY: useTransform(springX, [0, 800], [-3, 3]),
         }}
         className="relative z-10 flex flex-col items-center w-full max-w-[280px] perspective-[1000px]"
       >
         {/* Floating Rocket Icon */}
         <motion.div
           animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
           transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
           className="mb-6 relative"
         >
           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border
             ${isDark ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 border-white/10 shadow-blue-500/30' : 'bg-white border-blue-100 shadow-blue-200/40'}
           `}>
             <RocketOutlined className={`text-3xl ${isDark ? 'text-white' : 'text-blue-600'}`} />
           </div>
           <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-3 blur-md rounded-full animate-pulse
             ${isDark ? 'bg-blue-400/30' : 'bg-blue-300/20'}
           `} />
         </motion.div>
 
         {/* Title */}
         <h2 className={`text-xl font-bold mb-2 tracking-tight text-center
           ${isDark ? 'text-white' : 'text-gray-900'}
         `}>
           {title}
         </h2>
         
         {/* Description */}
         <p className={`text-[12px] mb-8 leading-relaxed text-center font-normal px-1
           ${isDark ? 'text-white/40' : 'text-gray-500'}
         `}>
           {description}
         </p>
 
         <div className="w-full space-y-4">
           <Button 
             type="primary" 
             size="large"
             block
             icon={<GlobalOutlined className="animate-spin-very-slow" />}
             onClick={() => router.push("/auth/login")}
             className={`h-11 border-none rounded-xl font-bold text-sm shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98]
               ${isDark ? 'bg-white text-[#03040a] hover:bg-white/90' : 'bg-blue-600 text-white hover:bg-blue-700'}
             `}
           >
             Bắt đầu hành trình
           </Button>
           
           <button 
             onClick={() => router.push("/auth/register")}
             className={`w-full text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 group
               ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}
             `}
           >
             <StarFilled className="text-[10px] group-hover:scale-110 transition-transform" /> 
             Tạo tài khoản miễn phí
           </button>
         </div>
       </motion.div>
 
       {/* Corner Accents */}
       <div className={`absolute top-6 left-6 w-3 h-3 border-t border-l transition-colors duration-500
         ${isDark ? 'border-white/10' : 'border-blue-200'}
       `} />
       <div className={`absolute bottom-6 right-6 w-3 h-3 border-b border-r transition-colors duration-500
         ${isDark ? 'border-white/10' : 'border-blue-200'}
       `} />
 
       <style jsx global>{`
         @keyframes spin-very-slow {
           from { transform: rotate(0deg); }
           to { transform: rotate(360deg); }
         }
         .animate-spin-very-slow {
           animation: spin-very-slow 15s linear infinite;
         }
       `}</style>
     </div>
   );
 }
