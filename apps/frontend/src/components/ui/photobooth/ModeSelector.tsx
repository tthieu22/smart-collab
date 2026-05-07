import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Image as ImageIcon, Layout, Columns, User, Calendar, MapPin } from 'lucide-react';
import { Input } from 'antd';
import { PhotoboothMode } from './types';
import { UI_CONFIG } from '@smart/lib/constants';

interface ModeSelectorProps {
    onSelect: (mode: PhotoboothMode, userName: string) => void;
}

const MODES = [
    {
        id: 'single' as PhotoboothMode,
        label: 'Chụp 1 ảnh',
        icon: ImageIcon,
        description: 'Chụp một tấm duy nhất',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'grid-4' as PhotoboothMode,
        label: '4 Ảnh (Grid)',
        icon: LayoutGrid,
        description: 'Bố cục 2x2 hiện đại',
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 'strip-4' as PhotoboothMode,
        label: '4 Ảnh (Dọc)',
        icon: Columns,
        description: 'Kiểu Hàn Quốc chuẩn, phong cách thời thượng',
        color: 'from-amber-500 to-orange-500'
    }
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect }) => {
    const [userName, setUserName] = useState('');

    return (
        <div className="w-full h-full bg-white dark:bg-[#020617] flex flex-col items-center justify-start sm:justify-center p-4 sm:p-8 overflow-y-auto relative custom-scrollbar transition-colors duration-500">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-[0.05] dark:opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#3b82f6_0%,_transparent_50%)]" />
            </div>

            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-6 sm:mb-10 z-10 pt-4 sm:pt-0"
            >
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase italic">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        {UI_CONFIG.PHOTOBOOTH.TITLE.split(' ')[0]}
                    </span> {UI_CONFIG.PHOTOBOOTH.TITLE.split(' ')[1]}
                </h2>
                <p className="text-slate-500 dark:text-white/40 font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px]">
                    {UI_CONFIG.PHOTOBOOTH.SUBTITLE}
                </p>
            </motion.div>

            {/* User Branding Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-[32px] p-5 sm:p-8 mb-6 sm:mb-10 backdrop-blur-2xl shadow-xl dark:shadow-2xl relative overflow-hidden group shrink-0"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 opacity-50" />
                
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                        <User size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">Định danh phi hành gia</span>
                </div>
                
                <Input
                    placeholder="Nhập tên hiển thị trên ảnh..."
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 h-12 sm:h-14 rounded-xl sm:rounded-2xl focus:border-blue-500 hover:border-blue-500 transition-all text-sm sm:text-base font-bold"
                />
                
                <div className="flex items-center justify-between mt-4 sm:mt-6 text-[9px] sm:text-[10px] text-slate-400 dark:text-white/30 font-black uppercase tracking-widest px-1">
                    <div className="flex items-center gap-1.5 sm:gap-2"><Calendar size={11} className="text-blue-500/40 dark:text-blue-500/50" /> {new Date().toLocaleDateString('vi-VN')}</div>
                    <div className="flex items-center gap-1.5 sm:gap-2"><MapPin size={11} className="text-blue-500/40 dark:text-blue-500/50" /> {UI_CONFIG.PHOTOBOOTH.STATION}</div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl w-full z-10 pb-8 sm:pb-0">
                {MODES.map((mode, index) => (
                    <motion.button
                        key={mode.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        whileHover={{ y: -8 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(mode.id, userName)}
                        className="relative group bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-[32px] p-5 sm:p-8 flex flex-col items-center text-center hover:border-blue-500/50 hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-all duration-500 shadow-sm hover:shadow-xl dark:shadow-none"
                    >
                        <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-4 sm:mb-6 shadow-2xl relative group-hover:scale-110 transition-transform duration-500`}>
                            <div className="absolute inset-0 bg-white/20 rounded-2xl sm:rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <mode.icon className="w-7 h-7 sm:w-10 sm:h-10 text-white relative z-10" />
                        </div>

                        <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2 uppercase tracking-tight">{mode.label}</h3>
                        <p className="text-slate-500 dark:text-white/40 text-[10px] sm:text-xs font-medium leading-relaxed px-2 sm:px-4">{mode.description}</p>

                        <div className="mt-4 sm:mt-8 px-5 sm:px-6 py-1.5 sm:py-2 bg-blue-500 text-white rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest sm:opacity-0 group-hover:opacity-100 transition-all transform sm:translate-y-2 group-hover:translate-y-0 shadow-lg shadow-blue-500/30">
                            Bắt đầu quét
                        </div>

                        {/* Animated border line */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-blue-500 group-hover:w-1/2 transition-all duration-500 rounded-full" />
                    </motion.button>
                ))}
            </div>
        </div>
    );
};
