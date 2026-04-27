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
        <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row items-center justify-center p-8 gap-8 md:gap-16 overflow-y-auto">
            {/* Photo Preview */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="relative bg-white dark:bg-neutral-900 p-3 md:p-6 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] rounded-lg border border-slate-200 dark:border-white/5"
            >
                <img src={imageUrl} alt="Result" className="max-h-[60vh] object-contain rounded-md shadow-sm block" />

                <div className="absolute -top-4 -right-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white dark:border-neutral-900">
                    <CheckCircle2 size={24} />
                </div>
            </motion.div>

            {/* Action Panel */}
            <div className="flex flex-col gap-8 max-w-sm w-full">
                <div className="text-center md:text-left">
                    <div className="inline-block px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                        Completed successfully
                    </div>
                    <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter italic">SIÊU PHẨM! 🔥</h2>
                    <p className="text-slate-500 dark:text-white/40 font-medium">Bức ảnh của bạn trông thật tuyệt vời.</p>
                </div>

                {/* QR Section */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm dark:shadow-none backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                            <QrCode size={20} />
                        </div>
                        <div>
                            <h4 className="text-slate-800 dark:text-white font-black text-sm uppercase tracking-wide">Tải về Mobile</h4>
                            <p className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-widest font-bold">Scan to download</p>
                        </div>
                    </div>

                    <div className="flex gap-5 items-center">
                        <div className="w-28 h-28 bg-white p-2 rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://smart-collab.io/photo/123" alt="QR Code" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <p className="text-[11px] text-slate-500 dark:text-white/60 leading-relaxed font-medium">Sử dụng camera điện thoại để quét mã và lưu ảnh ngay.</p>
                            <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400 text-[10px] font-black">
                                <Smartphone size={14} />
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
                            className="h-14 px-8 rounded-2xl font-bold flex-1 border-slate-200 dark:border-white/10 dark:bg-white/5 text-slate-700 dark:text-white dark:hover:bg-white/10"
                        >
                            PC
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
                            className="h-14 px-8 rounded-2xl font-bold flex-1 bg-blue-600 border-none shadow-lg shadow-blue-600/20"
                        >
                            Share
                        </Button>
                    </div>

                    <Button
                        size="large"
                        type="primary"
                        onClick={() => onConfirm(imageBlob)}
                        className="h-16 rounded-2xl font-black bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-95 transition-all border-none w-full uppercase tracking-widest text-xs shadow-xl"
                    >
                        Lưu & Kết thúc 🚀
                    </Button>
                </div>

                <button
                    onClick={onRestart}
                    className="flex items-center justify-center gap-2 text-slate-400 dark:text-white/20 hover:text-blue-500 dark:hover:text-blue-400 transition-all text-[10px] font-black uppercase tracking-[0.2em] py-2"
                >
                    <RefreshCw size={14} className="animate-spin-slow" />
                    <span>Chụp bộ ảnh mới</span>
                </button>
            </div>
        </div>
    );
};
