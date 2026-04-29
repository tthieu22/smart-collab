"use client";
 
 import React, { useState, useEffect, useRef } from "react";
 import { useUserStore } from "@smart/store/user";
 import { useBoardStore } from "@smart/store/setting";
 
 interface Particle {
   x: number;
   y: number;
   vx: number;
   vy: number;
   life: number;
   size: number;
   color: string;
   type: "star" | "circle" | "sparkle";
 }
 
 export default function ProjectGuestCursor() {
   const { currentUser } = useUserStore();
   const theme = useBoardStore((s) => s.resolvedTheme);
   const isDark = theme === "dark";
   
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const mouseRef = useRef({ x: -100, y: -100, active: false });
   const particlesRef = useRef<Particle[]>([]);
   const requestRef = useRef<number>(0);
 
   useEffect(() => {
     if (currentUser) return;
 
     const handleMouseMove = (e: MouseEvent) => {
       const target = e.target as HTMLElement;
       const isOverOverlay = target.closest('.login-overlay-container');
       
       mouseRef.current.x = e.clientX;
       mouseRef.current.y = e.clientY;
       mouseRef.current.active = !!isOverOverlay;
 
       if (mouseRef.current.active) {
         // Emit particles on move
         createParticles(e.clientX, e.clientY);
       }
     };
 
     const createParticles = (x: number, y: number) => {
       const colors = isDark 
         ? ["#60a5fa", "#ffffff", "#93c5fd", "#f0f9ff", "#3b82f6"] 
         : ["#2563eb", "#3b82f6", "#60a5fa", "#1d4ed8", "#93c5fd"];
       
       // Create multiple particles per move for richness
       for (let i = 0; i < 3; i++) {
         const type: any = Math.random() > 0.7 ? "star" : (Math.random() > 0.4 ? "sparkle" : "circle");
         particlesRef.current.push({
           x,
           y,
           vx: (Math.random() - 0.5) * 2,
           vy: (Math.random() - 0.5) * 2 - 0.5, // Slight upward drift
           life: 1.0,
           size: Math.random() * (type === "star" ? 6 : 3) + 1,
           color: colors[Math.floor(Math.random() * colors.length)],
           type
         });
       }
     };
 
     const animate = () => {
       const canvas = canvasRef.current;
       if (!canvas) return;
       const ctx = canvas.getContext("2d");
       if (!ctx) return;
 
       ctx.clearRect(0, 0, canvas.width, canvas.height);
 
       // Update and draw particles
       for (let i = particlesRef.current.length - 1; i >= 0; i--) {
         const p = particlesRef.current[i];
         p.x += p.vx;
         p.y += p.vy;
         p.life -= 0.015; // Fade rate
         
         if (p.life <= 0) {
           particlesRef.current.splice(i, 1);
           continue;
         }
 
         ctx.globalAlpha = p.life;
         ctx.fillStyle = p.color;
         ctx.shadowBlur = 10 * p.life;
         ctx.shadowColor = p.color;
 
         if (p.type === "star") {
           drawStar(ctx, p.x, p.y, 5, p.size * p.life, (p.size/2) * p.life);
         } else if (p.type === "sparkle") {
           ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
         } else {
           ctx.beginPath();
           ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
           ctx.fill();
         }
       }
 
       // Add a soft glow under the actual mouse
       if (mouseRef.current.active) {
         const gradient = ctx.createRadialGradient(
           mouseRef.current.x, mouseRef.current.y, 0,
           mouseRef.current.x, mouseRef.current.y, 50
         );
         const glowColor = isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(37, 99, 235, 0.1)";
         gradient.addColorStop(0, glowColor);
         gradient.addColorStop(1, "transparent");
         ctx.globalAlpha = 1;
         ctx.fillStyle = gradient;
         ctx.fillRect(mouseRef.current.x - 50, mouseRef.current.y - 50, 100, 100);
       }
 
       requestRef.current = requestAnimationFrame(animate);
     };
 
     const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
       let rot = Math.PI / 2 * 3;
       let x = cx;
       let y = cy;
       const step = Math.PI / spikes;
 
       ctx.beginPath();
       ctx.moveTo(cx, cy - outerRadius);
       for (let i = 0; i < spikes; i++) {
         x = cx + Math.cos(rot) * outerRadius;
         y = cy + Math.sin(rot) * outerRadius;
         ctx.lineTo(x, y);
         rot += step;
 
         x = cx + Math.cos(rot) * innerRadius;
         y = cy + Math.sin(rot) * innerRadius;
         ctx.lineTo(x, y);
         rot += step;
       }
       ctx.lineTo(cx, cy - outerRadius);
       ctx.closePath();
       ctx.fill();
     };
 
     const resize = () => {
       if (canvasRef.current) {
         canvasRef.current.width = window.innerWidth;
         canvasRef.current.height = window.innerHeight;
       }
     };
 
     window.addEventListener("mousemove", handleMouseMove);
     window.addEventListener("resize", resize);
     resize();
     requestRef.current = requestAnimationFrame(animate);
 
     return () => {
       window.removeEventListener("mousemove", handleMouseMove);
       window.removeEventListener("resize", resize);
       cancelAnimationFrame(requestRef.current);
     };
   }, [currentUser, isDark]);
 
   if (currentUser) return null;
 
   return (
     <canvas
       ref={canvasRef}
       className="fixed inset-0 pointer-events-none z-[9999]"
       style={{ mixBlendMode: isDark ? "screen" : "multiply" }}
     />
   );
 }
