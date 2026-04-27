'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Loader2, Camera, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraViewProps {
    onCapture: (blob: Blob, dataUrl: string) => void;
    isCapturing: boolean;
    filter?: string;
    mirrored?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
    onCapture,
    isCapturing,
    filter = 'none',
    mirrored = true
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let currentStream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Trình duyệt không hỗ trợ truy cập Camera');
                }

                const s = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false,
                });
                currentStream = s;
                setStream(s);

                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play().catch(e => {
                            console.error("Video play error:", e);
                            setError('Không thể tự động phát video. Vui lòng kiểm tra quyền.');
                        });
                        setLoading(false);
                    };
                }
            } catch (err: any) {
                console.error('Error accessing camera:', err);
                if (err.name === 'NotAllowedError') {
                    setError('Quyền truy cập Camera bị từ chối. Vui lòng cho phép trong cài đặt trình duyệt.');
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    setError('Không tìm thấy Camera kết nối với thiết bị.');
                } else {
                    setError(err.message || 'Lỗi không xác định khi truy cập Camera');
                }
                setLoading(false);
            }
        };

        startCamera();

        // Check for disconnection
        const handleDisconnect = () => setError('Camera đã bị ngắt kết nối.');
        navigator.mediaDevices.addEventListener('devicechange', handleDisconnect);

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            navigator.mediaDevices.removeEventListener('devicechange', handleDisconnect);
        };
    }, []);

    // Handle capture trigger from parent
    useEffect(() => {
        if (isCapturing && videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Handle mirroring
                if (mirrored) {
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                }

                // Apply same filter to capture
                context.filter = filter;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Reset transform
                context.setTransform(1, 0, 0, 1, 0, 0);
                context.filter = 'none';

                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                canvas.toBlob((blob) => {
                    if (blob) onCapture(blob, dataUrl);
                }, 'image/jpeg', 0.95);
            }
        }
    }, [isCapturing, onCapture, mirrored, filter]);

    return (
        <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center">
            <motion.video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                animate={{
                    scale: isCapturing ? [1, 0.98, 1] : 1,
                    filter: filter
                }}
                className={`w-full h-full object-cover transition-transform duration-300 ${mirrored ? 'scale-x-[-1]' : ''}`}
            />

            <canvas ref={canvasRef} className="hidden" />

            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10"
                    >
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-white font-medium animate-pulse">Đang chuẩn bị Camera xịn...</p>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 p-10 text-center"
                    >
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <Camera className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Oops! Có lỗi rồi</h3>
                        <p className="text-white/60 max-w-sm">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Thử khởi động lại
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Simulated Flash */}
            <AnimatePresence>
                {isCapturing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="absolute inset-0 bg-white z-50 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Camera UI Overlay */}
            <div className="absolute top-6 right-6 flex flex-col gap-4">
                <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-white font-bold tracking-widest uppercase">REC • LIVE</span>
                </div>
            </div>
        </div>
    );
};
