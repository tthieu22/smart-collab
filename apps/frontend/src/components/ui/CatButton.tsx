"use client";
 
 import React, { useState } from "react";
 import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";
 
 interface CatButtonProps {
   text: string;
   onClick?: () => void;
   className?: string;
   loading?: boolean;
   htmlType?: "button" | "submit" | "reset";
 }
 
 export default function CatButton({ text, onClick, className = "", loading = false, htmlType = "button" }: CatButtonProps) {
   const [hasError, setHasError] = useState(false);
 
   const { RiveComponent, rive } = useRive({
     // Use the relative path correctly
     src: "/cat-button.riv",
     stateMachines: "State Machine 1",
     autoplay: true,
     onLoadError: () => {
       console.error("Failed to load Rive file: /cat-button.riv");
       setHasError(true);
     },
     layout: new Layout({
       fit: Fit.Contain,
       alignment: Alignment.Center,
     }),
   });
 
   const handleMouseDown = () => {
     if (rive) {
       const inputs = rive.stateMachineInputs("State Machine 1");
       if (inputs) {
         const pressInput = inputs.find(i => i.name === "pressed" || i.name === "isPressed" || i.name === "Trigger");
         if (pressInput) pressInput.value = true;
       }
     }
   };
 
   const handleMouseUp = () => {
     if (rive) {
       const inputs = rive.stateMachineInputs("State Machine 1");
       if (inputs) {
         const pressInput = inputs.find(i => i.name === "pressed" || i.name === "isPressed" || i.name === "Trigger");
         if (pressInput) pressInput.value = false;
       }
     }
   };
 
   // Fallback to a standard styled button if Rive fails to load
   if (hasError) {
     return (
       <button 
         type={htmlType}
         className={`w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm uppercase shadow-lg ${className}`}
         onClick={onClick}
       >
         {loading ? "Đang xử lý..." : text}
       </button>
     );
   }
 
   return (
     <div className={`w-full ${className}`}>
       <button 
         type={htmlType}
         className={`relative w-full h-[56px] border-none !bg-transparent p-0 cursor-pointer select-none group active:scale-95 transition-all outline-none rounded-xl overflow-hidden ${loading ? 'opacity-70 pointer-events-none' : ''}`}
         onClick={onClick}
         onMouseDown={handleMouseDown}
         onMouseUp={handleMouseUp}
         style={{ backgroundColor: 'transparent' }}
       >
         {/* Rive Background Animation */}
         <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
            <div className="w-full h-full min-w-[200px]">
                <RiveComponent />
            </div>
         </div>
 
         {/* Text Overlay */}
         <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
           <span className="text-white font-black text-[15px] tracking-[0.5px] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
             {loading ? "Đang xử lý..." : text}
           </span>
         </div>
       </button>
     </div>
   );
 }
