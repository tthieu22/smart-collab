'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check, Trash2, Camera } from 'lucide-react';
import { Button } from 'antd';
import { CapturedPhoto, PhotoboothTemplate } from './types';

interface ReviewScreenProps {
    photos: CapturedPhoto[];
    template: PhotoboothTemplate;
    onRetake: (index: number) => void;
    onConfirm: () => void;
    onRetakeAll: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
    photos,
    template,
    onRetake,
    onConfirm,
    onRetakeAll
}) => {
    return (
        <div className="w-full h-full bg-slate-950 flex flex-col items-center p-6 overflow-y-auto">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-8"
            >
                <h2 className="text-2xl font-black text-white mb-2">KIỂM TRA LẠI 📸</h2>
                <p className="text-white/40">Bạn có muốn chụp lại tấm nào không?</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full mb-12">
                <AnimatePresence mode="popLayout">
                    {photos.map((photo, index) => (
                        <motion.div
                            key={photo.id}
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            whileHover={{ y: -5 }}
                            className="relative group aspect-[3/4] bg-white/5 rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                        >
                            <img src={photo.url} alt={`Shot ${index + 1}`} className="w-full h-full object-cover" />

                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4">
                                <div className="text-center px-4">
                                    <p className="text-white font-black text-lg mb-1 uppercase italic tracking-tighter">ẢNH {index + 1}</p>
                                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest leading-none">Bạn chưa ưng ý tấm này?</p>
                                </div>

                                <button
                                    onClick={() => onRetake(index)}
                                    className="p-4 bg-white text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl font-bold flex flex-col items-center gap-2"
                                >
                                    <RefreshCw size={24} className="text-blue-600" />
                                    <span className="text-[10px] uppercase tracking-tight">Chụp lại ngay</span>
                                </button>
                            </div>

                            <div className="absolute top-4 left-4 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg">
                                {index + 1}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="flex flex-wrap justify-center gap-4 w-full max-w-lg mb-8">
                <Button
                    size="large"
                    danger
                    icon={<Trash2 size={18} />}
                    onClick={onRetakeAll}
                    className="h-14 px-8 rounded-2xl font-bold flex-1 border-none bg-red-500/10 text-red-500 hover:bg-red-500/20"
                >
                    Xóa hết làm lại
                </Button>
                <Button
                    size="large"
                    type="primary"
                    icon={<Check size={18} />}
                    onClick={onConfirm}
                    className="h-14 px-12 rounded-2xl font-bold flex-1 bg-blue-600 shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)]"
                >
                    Tiếp tục ghép ảnh
                </Button>
            </div>

            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">Smart Collab Photobooth Standard High Quality</p>
        </div>
    );
};
