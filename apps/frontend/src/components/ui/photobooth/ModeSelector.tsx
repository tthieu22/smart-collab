import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Image as ImageIcon, Layout, Columns, User, Calendar, MapPin } from 'lucide-react';
import { Input } from 'antd';
import { PhotoboothMode } from './types';

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
        <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 overflow-y-auto">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-12"
            >
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight uppercase">Bắt đầu trải nghiệm ✨</h2>
                <p className="text-slate-500 dark:text-white/40 font-medium">Chọn phong cách và để lại dấu ấn của bạn</p>
            </motion.div>

            {/* User Branding Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 mb-12 backdrop-blur-xl shadow-xl dark:shadow-none"
            >
                <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-400">
                    <User size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Thông tin cá nhân</span>
                </div>
                <Input
                    placeholder="Nhập tên của bạn (Tùy chọn)"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 h-12 rounded-xl focus:border-blue-500 hover:border-blue-500 transition-all"
                />
                <div className="flex items-center justify-between mt-4 text-[10px] text-slate-400 dark:text-white/30 font-medium px-1">
                    <div className="flex items-center gap-1"><Calendar size={10} /> {new Date().toLocaleDateString()}</div>
                    <div className="flex items-center gap-1"><MapPin size={10} /> Smart Office</div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                {MODES.map((mode, index) => (
                    <motion.button
                        key={mode.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(mode.id, userName)}
                        className="relative group overflow-hidden bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center text-center hover:shadow-2xl dark:hover:bg-white/10 transition-all duration-300"
                    >
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3`}>
                            <mode.icon className="w-10 h-10 text-white" />
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{mode.label}</h3>
                        <p className="text-slate-500 dark:text-white/40 text-sm leading-relaxed">{mode.description}</p>

                        <div className="mt-6 px-4 py-1.5 bg-slate-100 dark:bg-white/10 rounded-full text-[10px] text-slate-500 dark:text-white/60 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                            Chọn ngay
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 dark:from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                ))}
            </div>
        </div>
    );
};
