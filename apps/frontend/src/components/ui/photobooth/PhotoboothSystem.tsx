'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { message, App, Button } from 'antd';
import { Camera, Wand2, X, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

import { PhotoboothStep, PhotoboothMode, PhotoboothConfig, CapturedPhoto, Sticker } from './types';
import { IdleState } from './IdleState';
import { ModeSelector } from './ModeSelector';
import { CameraView } from './CameraView';
import { CountdownTimer } from './CountdownTimer';
import { ReviewScreen } from './ReviewScreen';
import { StickerEditor } from './StickerEditor';
import { ResultView } from './ResultView';
import { generateComposition } from './composition';
import { DEFAULT_TEMPLATES } from './templates';
import { playSound } from './sounds';

interface PhotoboothSystemProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export const PhotoboothSystem: React.FC<PhotoboothSystemProps> = ({ onCapture, onClose }) => {
    const { message: messageApi } = App.useApp();
    const [step, setStep] = useState<PhotoboothStep>('idle');
    const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [resultUrl, setResultUrl] = useState<string>('');
    const [stickers, setStickers] = useState<Sticker[]>([]);

    // Cleanup Result URL
    useEffect(() => {
        return () => {
            if (resultUrl) URL.revokeObjectURL(resultUrl);
        };
    }, [resultUrl]);
    const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [config, setConfig] = useState<PhotoboothConfig>({
        mode: 'grid-4',
        template: DEFAULT_TEMPLATES['grid-4'],
        filter: 'none',
        frameStyle: 'white',
        countdown: 3,
        userName: '',
        showDate: true
    });

    // --- State Machine Helpers ---
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const IDLE_TIMEOUT = 180000; // 3 minutes

    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (step !== 'idle' && step !== 'result' && step !== 'capturing') {
            idleTimerRef.current = setTimeout(() => {
                handleRestart();
                setStep('timeout');
            }, IDLE_TIMEOUT);
        }
    }, [step]);

    useEffect(() => {
        resetIdleTimer();
        return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
    }, [resetIdleTimer]);

    const handleStart = () => {
        playSound('click');
        setStep('select-mode');
    };

    const handleModeSelect = (mode: PhotoboothMode, userName: string) => {
        playSound('click');
        const template = DEFAULT_TEMPLATES[mode] || DEFAULT_TEMPLATES['grid-4'];
        setConfig(prev => ({ ...prev, mode, template, userName }));
        setPhotos([]);
        setStep('countdown');
    };

    const handleCapture = useCallback((blob: Blob, url: string) => {
        if (photos.length >= config.template.slots.length && retakeIndex === null) return;

        const newPhoto = { id: Math.random().toString(36).substr(2, 9), url, blob };

        if (retakeIndex !== null) {
            setPhotos(prev => {
                const next = [...prev];
                next[retakeIndex] = newPhoto;
                return next;
            });
            setRetakeIndex(null);
            setStep('review');
        } else {
            setPhotos(prev => [...prev, newPhoto]);
            setIsCapturing(false);
        }
    }, [retakeIndex, photos.length, config.template.slots.length]);

    useEffect(() => {
        if ((step === 'countdown' || step === 'capturing') && retakeIndex === null) {
            if (photos.length >= config.template.slots.length) {
                setStep('review');
                playSound('success');
            } else if (step === 'capturing') {
                const timer = setTimeout(() => {
                    setStep('countdown');
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [photos.length, config.template.slots.length, step, retakeIndex]);

    const handleFinishCountdown = () => {
        setIsCapturing(true);
        setStep('capturing');
    };

    const handleRetakeSingle = (index: number) => {
        playSound('click');
        setRetakeIndex(index);
        setStep('countdown');
    };

    const handleConfirmReview = async () => {
        playSound('click');
        try {
            const blob = await generateComposition(photos, config);
            const url = URL.createObjectURL(blob);
            setResultBlob(blob);
            setResultUrl(url);
            setStep('editing');
        } catch (err) {
            console.error(err);
            setErrorMessage('Không thể tạo bản phối ảnh. Vui lòng thử lại.');
            setStep('error');
        }
    };

    const handleStickerComplete = async (newStickers: Sticker[]) => {
        playSound('click');
        setStickers(newStickers);
        try {
            const finalBlob = await generateComposition(photos, config, newStickers);
            const url = URL.createObjectURL(finalBlob);
            setResultBlob(finalBlob);
            setResultUrl(url);
            setStep('result');
        } catch (err) {
            console.error(err);
            messageApi.error('Lỗi khi lưu Sticker');
        }
    };

    const handleRestart = () => {
        playSound('click');
        setPhotos([]);
        setResultBlob(null);
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        setResultUrl('');
        setStickers([]);
        setErrorMessage(null);
        setStep('idle');
    };

    const handleConfirmFinal = (blob: Blob) => {
        playSound('click');
        const file = new File([blob], `smart-photobooth-${Date.now()}.png`, { type: 'image/png' });
        onCapture(file);
        onClose();
    };

    return (
        <div className="w-full h-full bg-white dark:bg-black relative font-sans text-slate-800 dark:text-white overflow-hidden select-none" onMouseMove={resetIdleTimer} onClick={resetIdleTimer}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#f8fafc_0%,_#e2e8f0_100%)] dark:bg-[radial-gradient(circle_at_50%_50%,_#1e293b_0%,_#020617_100%)] pointer-events-none" />

            <AnimatePresence mode="wait">
                {step === 'idle' && (
                    <motion.div key="idle" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <IdleState onStart={handleStart} />
                    </motion.div>
                )}

                {step === 'select-mode' && (
                    <motion.div key="mode" className="w-full h-full" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}>
                        <ModeSelector onSelect={handleModeSelect} />
                    </motion.div>
                )}

                {(step === 'countdown' || step === 'capturing') && (
                    <motion.div key="camera" className="w-full h-full relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <CameraView
                            isCapturing={isCapturing}
                            onCapture={handleCapture}
                            filter={config.filter}
                        />

                        {step === 'countdown' && (
                            <CountdownTimer seconds={config.countdown} onFinish={handleFinishCountdown} />
                        )}

                        <div className="absolute top-8 left-8 flex flex-col gap-4">
                            <div className="flex gap-2">
                                {config.template.slots.map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scale: i === photos.length ? [1, 1.2, 1] : 1,
                                            backgroundColor: i < photos.length ? "#3b82f6" : "rgba(255,255,255,0.2)"
                                        }}
                                        transition={{ repeat: i === photos.length ? Infinity : 0, duration: 1.5 }}
                                        className="w-3 h-3 rounded-full border border-white/20 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    />
                                ))}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                {retakeIndex !== null ? `CHỤP LẠI ẢNH ${retakeIndex + 1}` : `ẢNH ${photos.length + 1} / ${config.template.slots.length}`}
                            </p>
                        </div>

                        <div className="absolute bottom-10 left-10 flex gap-2">
                            {['none', 'grayscale(100%)', 'sepia(80%)', 'brightness(1.2) contrast(1.1)'].map((f, i) => (
                                <button
                                    key={i}
                                    onClick={() => setConfig(prev => ({ ...prev, filter: f }))}
                                    className={`w-10 h-10 rounded-full border-2 transition-all ${config.filter === f ? 'border-blue-500 scale-110 shadow-lg' : 'border-white/20 hover:border-white/50'}`}
                                    style={{ filter: f, backgroundColor: '#333' }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 'review' && (
                    <motion.div key="review" className="w-full h-full" initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <ReviewScreen
                            photos={photos}
                            template={config.template}
                            onRetake={handleRetakeSingle}
                            onRetakeAll={handleRestart}
                            onConfirm={handleConfirmReview}
                        />
                    </motion.div>
                )}

                {step === 'editing' && resultUrl && (
                    <motion.div key="editing" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <StickerEditor
                            imageUrl={resultUrl}
                            onConfirm={handleStickerComplete}
                            onCancel={() => setStep('review')}
                        />
                    </motion.div>
                )}

                {step === 'result' && resultUrl && (
                    <motion.div key="result" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <ResultView
                            imageBlob={resultBlob!}
                            imageUrl={resultUrl}
                            onRestart={handleRestart}
                            onConfirm={handleConfirmFinal}
                        />
                    </motion.div>
                )}

                {step === 'error' && (
                    <motion.div key="error" className="w-full h-full flex flex-col items-center justify-center p-10 bg-slate-950" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <AlertTriangle size={64} className="text-red-500 mb-6" />
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-wider italic">Hệ thống gặp sự cố</h2>
                        <p className="text-white/60 mb-8 text-center max-w-sm">{errorMessage}</p>
                        <Button type="primary" size="large" onClick={handleRestart} className="h-14 px-10 rounded-2xl bg-red-600 border-none font-bold">Quay lại trang chủ</Button>
                    </motion.div>
                )}

                {step === 'timeout' && (
                    <motion.div key="timeout" className="w-full h-full flex flex-col items-center justify-center p-10 bg-slate-950" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Clock size={64} className="text-blue-500 mb-6 animate-pulse" />
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-wider">Hết thời gian chờ</h2>
                        <p className="text-white/60 mb-8 text-center max-w-sm">Hệ thống đã tự động đặt lại để phục vụ người dùng tiếp theo.</p>
                        <Button type="primary" size="large" onClick={handleRestart} className="h-14 px-10 rounded-2xl bg-blue-600 border-none font-bold">Tôi đã quay lại!</Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {step !== 'idle' && (
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-90 z-[100]"
                >
                    <X size={20} className="text-white/60" />
                </button>
            )}
        </div>
    );
};
