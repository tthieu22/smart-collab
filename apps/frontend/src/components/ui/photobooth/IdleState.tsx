'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

interface IdleStateProps {
    onStart: () => void;
}

export const IdleState: React.FC<IdleStateProps> = ({ onStart }) => {
    return (
        <div
            className="relative w-full h-full cursor-pointer overflow-hidden group"
            onClick={onStart}
        >
            {/* Background with blur effect */}
            <div className="absolute inset-0 bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-50" />
                <div className="absolute inset-0 backdrop-blur-[2px]" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="mb-8"
                >
                    <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl relative">
                        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                        <Camera className="w-16 h-16 text-white group-hover:scale-110 transition-transform duration-300" />
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-black mb-4 tracking-tighter"
                >
                    SMART PHOTOBOOTH
                </motion.h1>

                <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xl font-medium text-blue-200 uppercase tracking-[0.2em]"
                >
                    Chạm để bắt đầu
                </motion.p>
            </div>

            {/* Decorative corners */}
            <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white/30 rounded-tl-2xl" />
            <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white/30 rounded-tr-2xl" />
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-white/30 rounded-bl-2xl" />
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-white/30 rounded-br-2xl" />
        </div>
    );
};
