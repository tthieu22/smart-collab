'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { UI_CONFIG } from '@smart/lib/constants';

interface IdleStateProps {
    onStart: () => void;
}

export const IdleState: React.FC<IdleStateProps> = ({ onStart }) => {
    return (
        <div
            className="relative w-full h-full cursor-pointer overflow-hidden group bg-white dark:bg-[#020617] transition-colors duration-500"
            onClick={onStart}
        >
            {/* Background with animated particles/grid */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-20 transition-opacity duration-500">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 dark:from-blue-600/10 dark:to-purple-600/10" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-start z-10 px-6 pt-10 sm:pt-20">
                <motion.div
                    animate={{
                        y: [0, -10, 0],
                        scale: [1, 1.02, 1]
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="mb-10"
                >
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[24px] sm:rounded-[32px] bg-white dark:bg-white/5 backdrop-blur-xl flex items-center justify-center border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-[0_0_50px_rgba(59,130,246,0.2)] relative group-hover:border-blue-500/50 transition-all duration-500">
                        <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[25px] sm:rounded-[33px] blur-lg opacity-10 dark:opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="absolute inset-3 sm:inset-4 rounded-[16px] sm:rounded-[20px] border border-gray-100 dark:border-white/5 flex items-center justify-center bg-gray-50/50 dark:bg-transparent">
                            <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-slate-800 dark:text-white group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        
                        {/* Scanning bar effect */}
                        <motion.div 
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-[2px] bg-blue-500/30 dark:bg-blue-400/50 shadow-[0_0_15px_#3b82f6] z-20 pointer-events-none"
                        />
                    </div>
                </motion.div>

                <div className="text-center space-y-2">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-3xl sm:text-5xl font-black tracking-tighter text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-white dark:to-white/40 uppercase px-4"
                    >
                        {UI_CONFIG.PHOTOBOOTH.TITLE}
                    </motion.h1>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] text-center">
                        {UI_CONFIG.PHOTOBOOTH.SUBTITLE}
                    </p>
                    <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="h-1 w-16 sm:w-24 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"
                    />
                </div>

                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="mt-10 sm:mt-12 flex flex-col items-center gap-3 sm:gap-4 text-center"
                >
                    <span className="text-[10px] sm:text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] sm:tracking-[0.4em]">
                        {UI_CONFIG.PHOTOBOOTH.ACTION_TEXT}
                    </span>
                    <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                            <motion.div 
                                key={i}
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                className="w-1 h-1 rounded-full bg-blue-500"
                            />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Futuristic corners */}
            <div className="absolute top-6 sm:top-10 left-6 sm:left-10 w-12 sm:w-16 h-12 sm:h-16 border-t-2 border-l-2 border-blue-500/20 dark:border-blue-500/30 rounded-tl-2xl sm:rounded-tl-3xl group-hover:border-blue-500 transition-all duration-700" />
            <div className="absolute top-6 sm:top-10 right-6 sm:right-10 w-12 sm:w-16 h-12 sm:h-16 border-t-2 border-r-2 border-blue-500/20 dark:border-blue-500/30 rounded-tr-2xl sm:rounded-tr-3xl group-hover:border-blue-500 transition-all duration-700" />
            <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 w-12 sm:w-16 h-12 sm:h-16 border-b-2 border-l-2 border-blue-500/20 dark:border-blue-500/30 rounded-bl-2xl sm:rounded-bl-3xl group-hover:border-blue-500 transition-all duration-700" />
            <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-10 w-12 sm:w-16 h-12 sm:h-16 border-b-2 border-r-2 border-blue-500/20 dark:border-blue-500/30 rounded-br-2xl sm:rounded-br-3xl group-hover:border-blue-500 transition-all duration-700" />
        </div>
    );
};
