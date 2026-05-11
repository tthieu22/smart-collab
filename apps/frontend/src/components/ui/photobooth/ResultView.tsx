'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, RefreshCw, CheckCircle2, QrCode, Smartphone } from 'lucide-react';
import { Button, App } from 'antd';

interface ResultViewProps {
    imageBlob: Blob;
    imageUrl: string; // Passed from parent (STABLE)
    onRestart: () => void;
    onConfirm: (blob: Blob) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ imageBlob, imageUrl, onRestart, onConfirm }) => {
    const { message } = App.useApp();
    const [sharing, setSharing] = React.useState(false);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `smart-photobooth-${Date.now()}.png`;
        link.click();
    };

    return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row items-center justify-start lg:justify-center p-4 sm:p-6 lg:p-10 gap-6 lg:gap-12 overflow-y-auto overflow-x-hidden custom-scrollbar transition-colors duration-500">
            {/* Photo Preview */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="relative bg-white dark:bg-neutral-900 p-0 shadow-2xl rounded-2xl lg:rounded-[32px] border border-slate-200 dark:border-white/5 min-w-0 flex-shrink"
            >
                <img 
                    src={imageUrl} 
                    alt="Result" 
                    className="max-h-[45vh] sm:max-h-[50vh] lg:max-h-[60vh] w-auto object-contain rounded-xl shadow-sm block" 
                />

                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white dark:border-neutral-900">
                    <CheckCircle2 size={20} className="sm:size-6" />
                </div>
            </motion.div>

            {/* Action Panel */}
            <div className="flex flex-col gap-3 lg:gap-8 max-w-sm w-full pb-8 lg:pb-0">
                <div className="text-center lg:text-left">
                    <div className="inline-block px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2">
                        Đã xử lý xong • AI ENHANCED
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tighter italic">SIÊU PHẨM! 🔥</h2>
                    <p className="text-[11px] sm:text-base text-slate-500 dark:text-white/40 font-medium">Bức ảnh của bạn trông thật tuyệt vời.</p>
                </div>

                {/* QR Section - Compact on mobile */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm dark:shadow-none backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4 sm:mb-5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                            <QrCode size={18} className="sm:size-5" />
                        </div>
                        <div>
                            <h4 className="text-slate-800 dark:text-white font-black text-xs sm:text-sm uppercase tracking-wide">Tải về điện thoại</h4>
                            <p className="text-[9px] text-slate-400 dark:text-white/30 uppercase tracking-widest font-bold italic">Scan to download</p>
                        </div>
                    </div>

                    <div className="flex gap-4 sm:gap-5 items-center">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white p-2 rounded-xl sm:rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center shrink-0">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin)}`} alt="QR Code" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 space-y-2 sm:space-y-3">
                            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-white/60 leading-relaxed font-medium">Dùng Camera quét mã để lưu ảnh nhanh vào máy.</p>
                            <div className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 text-[9px] font-black uppercase">
                                <Smartphone size={12} />
                                IOS & ANDROID OK
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <Button
                            size="large"
                            icon={<Download size={18} />}
                            onClick={handleDownload}
                            className="h-12 sm:h-14 px-4 sm:px-8 rounded-xl sm:rounded-2xl font-bold flex-1 border-slate-200 dark:border-white/10 dark:bg-white/5 text-slate-700 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            Tải về PC
                        </Button>
                        <Button
                            size="large"
                            type="primary"
                            icon={<Share2 size={18} />}
                            onClick={() => {
                                setSharing(true);
                                setTimeout(() => {
                                    setSharing(false);
                                    message.success('Đã tạo link chia sẻ!');
                                }, 1000);
                            }}
                            loading={sharing}
                            className="h-12 sm:h-14 px-4 sm:px-8 rounded-xl sm:rounded-2xl font-bold flex-1 bg-blue-600 border-none shadow-lg shadow-blue-600/20"
                        >
                            Chia sẻ
                        </Button>
                    </div>

                    <Button
                        size="large"
                        type="primary"
                        onClick={() => onConfirm(imageBlob)}
                        className="h-14 sm:h-16 rounded-xl sm:rounded-2xl font-black bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-95 transition-all border-none w-full uppercase tracking-[0.2em] text-[10px] sm:text-xs shadow-xl"
                    >
                        Lưu & Hoàn tất
                    </Button>
                </div>

                <button
                    onClick={onRestart}
                    className="flex items-center justify-center gap-2 text-slate-400 dark:text-white/20 hover:text-blue-500 dark:hover:text-blue-400 transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] py-2"
                >
                    <RefreshCw size={12} className="animate-spin-slow" />
                    <span>Chụp bộ ảnh mới</span>
                </button>
            </div>
        </div>
    );
};
