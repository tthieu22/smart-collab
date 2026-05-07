'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Check, RotateCcw, X as CloseIcon, Music, ChevronUp, ChevronDown, Trash2, Edit3, Layers } from 'lucide-react';
import { Button } from 'antd';
import { Sticker } from './types';
import { playSound } from './sounds';

interface StickerEditorProps {
    imageUrl: string;
    onConfirm: (stickers: Sticker[]) => void;
    onCancel: () => void;
}

const STICKER_OPTIONS = [
    { id: 's1', url: 'https://cdn-icons-png.flaticon.com/512/742/742751.png' },
    { id: 's2', url: 'https://cdn-icons-png.flaticon.com/512/2107/2107845.png' },
    { id: 's3', url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' },
    { id: 's4', url: 'https://cdn-icons-png.flaticon.com/512/9131/9131546.png' },
    { id: 's5', url: 'https://cdn-icons-png.flaticon.com/512/1001/1001371.png' },
    { id: 's6', url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' },
    { id: 's7', url: 'https://cdn-icons-png.flaticon.com/512/7321/7321031.png' },
    { id: 's8', url: 'https://cdn-icons-png.flaticon.com/512/2164/2164600.png' },
    { id: 's9', url: 'https://cdn-icons-png.flaticon.com/512/1164/1164620.png' },
    { id: 's10', url: 'https://cdn-icons-png.flaticon.com/512/1533/1533913.png' },
    { id: 's11', url: 'https://cdn-icons-png.flaticon.com/512/3208/3208083.png' },
    { id: 's12', url: 'https://cdn-icons-png.flaticon.com/512/4112/4112678.png' },
    { id: 's13', url: 'https://cdn-icons-png.flaticon.com/512/616/616430.png' },
];

export const StickerEditor: React.FC<StickerEditorProps> = ({ imageUrl, onConfirm, onCancel }) => {
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [customIcon, setCustomIcon] = useState('');
    const [activeLibrarySticker, setActiveLibrarySticker] = useState<string>(STICKER_OPTIONS[0].url);

    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const addSticker = (url: string, x = 50, y = 50) => {
        playSound('click');
        const newSticker: Sticker = {
            id: 'stk-' + Date.now(),
            url,
            x, y, scale: 1, rotation: 0
        };
        setStickers(prev => [...prev, newSticker]);
        setSelectedId(newSticker.id);
    };

    const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current || !imageRef.current) return;
        
        // If clicking on an existing sticker, don't add a new one
        if ((e.target as HTMLElement).closest('.sticker-item')) return;

        const rect = imageRef.current.getBoundingClientRect();
        let clientX, clientY;
        
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
            addSticker(activeLibrarySticker, x, y);
        }
    };

    const handleCustomIconSubmit = () => {
        if (customIcon.trim()) {
            const emojiUrl = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${Array.from(customIcon.trim())[0].codePointAt(0)?.toString(16)}.png`;
            // If it's a simple character or doesn't resolve to twemoji, we can use a data URL or just text
            // For now, let's treat it as a text-based icon or use a service
            setActiveLibrarySticker(customIcon.trim());
            addSticker(customIcon.trim());
            setCustomIcon('');
        }
    };

    const updateSticker = (id: string, updates: Partial<Sticker>) => {
        setStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const moveLayer = (id: string, direction: 'up' | 'down') => {
        setStickers(prev => {
            const idx = prev.findIndex(s => s.id === id);
            if (idx === -1) return prev;
            const nextIdx = direction === 'up' ? idx + 1 : idx - 1;
            if (nextIdx < 0 || nextIdx >= prev.length) return prev;
            const n = [...prev];
            [n[idx], n[nextIdx]] = [n[nextIdx], n[idx]];
            return n;
        });
    };

    const handleDragEnd = (event: any, id: string) => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const stickerRect = event.target.getBoundingClientRect();
        
        // Calculate center of the sticker relative to the image
        const centerX = stickerRect.left + stickerRect.width / 2;
        const centerY = stickerRect.top + stickerRect.height / 2;

        const newX = ((centerX - rect.left) / rect.width) * 100;
        const newY = ((centerY - rect.top) / rect.height) * 100;
        
        updateSticker(id, { x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) });
    };

    const selectedSticker = stickers.find(s => s.id === selectedId);

    const isEmoji = (url: string) => !url.startsWith('http') && url.length <= 4;

    return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row p-0 lg:p-6 gap-0 lg:gap-6 overflow-hidden transition-colors duration-500">
            {/* Sidebar / Bottom Bar */}
            <div className="w-full lg:w-96 bg-white dark:bg-slate-900 lg:rounded-[32px] p-4 lg:p-8 flex flex-col border-b lg:border border-slate-200 dark:border-white/10 shrink-0 shadow-2xl overflow-hidden z-20 order-2 lg:order-1">
                <div className="hidden lg:flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Smile className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-lg leading-none">Editor</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Stickers & Layers</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 md:space-y-8 pr-1">
                    <AnimatePresence mode="wait">
                        {selectedSticker ? (
                            <motion.section
                                key="adjust"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="bg-blue-600 rounded-[20px] md:rounded-[24px] p-4 md:p-6 text-white shadow-xl shadow-blue-500/20"
                            >
                                <div className="flex items-center justify-between mb-4 md:mb-6">
                                    <div className="flex items-center gap-2">
                                        <Edit3 size={14} className="md:size-4" />
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Đang chỉnh sửa</span>
                                    </div>
                                    <button onClick={() => setSelectedId(null)} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                                        <CloseIcon size={16} />
                                    </button>
                                </div>

                                <div className="space-y-4 md:space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-2 md:mb-3 text-[10px] md:text-[11px] font-bold uppercase tracking-wide">
                                            <span>Kích thước</span>
                                            <span className="bg-white/20 px-2 py-0.5 rounded-md">{Math.round(selectedSticker.scale * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0.2" max="3" step="0.1"
                                            value={selectedSticker.scale}
                                            onChange={(e) => updateSticker(selectedId!, { scale: parseFloat(e.target.value) })}
                                            className="w-full h-1 bg-white/30 rounded-full appearance-none accent-white cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2 md:mb-3 text-[10px] md:text-[11px] font-bold uppercase tracking-wide">
                                            <span>Góc xoay</span>
                                            <span className="bg-white/20 px-2 py-0.5 rounded-md">{Math.round((selectedSticker.rotation * 180) / Math.PI)}°</span>
                                        </div>
                                        <input
                                            type="range" min={-Math.PI} max={Math.PI} step="0.1"
                                            value={selectedSticker.rotation}
                                            onChange={(e) => updateSticker(selectedId!, { rotation: parseFloat(e.target.value) })}
                                            className="w-full h-1 bg-white/30 rounded-full appearance-none accent-white cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={() => moveLayer(selectedId!, 'down')} className="flex-1 h-10 md:h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"><ChevronDown size={18} /></button>
                                        <button onClick={() => moveLayer(selectedId!, 'up')} className="flex-1 h-10 md:h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"><ChevronUp size={18} /></button>
                                        <button onClick={() => { setStickers(prev => prev.filter(s => s.id !== selectedId)); setSelectedId(null); }} className="flex-1 h-10 md:h-12 bg-red-400/90 text-white rounded-xl flex items-center justify-center hover:bg-red-500 transition-all shadow-lg"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            </motion.section>
                        ) : (
                            <motion.section
                                key="library"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <Layers size={12} className="text-slate-400" />
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Tự nhập Icon/Emoji</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            placeholder="Nhập emoji..." 
                                            value={customIcon}
                                            onChange={e => setCustomIcon(e.target.value)}
                                            className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                                            onKeyDown={e => e.key === 'Enter' && handleCustomIconSubmit()}
                                        />
                                        <button 
                                            onClick={handleCustomIconSubmit}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors"
                                        >
                                            Thêm
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Smile size={12} className="text-slate-400" />
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Thư viện Sticker (Chạm ảnh để chèn)</p>
                                    </div>
                                    <div className="grid grid-cols-5 md:grid-cols-3 gap-2 md:gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                                        {STICKER_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setActiveLibrarySticker(opt.url);
                                                    playSound('click');
                                                }}
                                                className={`aspect-square rounded-xl md:rounded-2xl p-2 transition-all duration-300 border active:scale-95 group shrink-0 ${
                                                    activeLibrarySticker === opt.url 
                                                    ? 'bg-blue-50 border-blue-500 dark:bg-blue-500/20' 
                                                    : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5'
                                                }`}
                                            >
                                                <img src={opt.url} alt="Sticker" className="w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-4 lg:mt-8 flex gap-3">
                    <Button block onClick={() => { setStickers([]); setSelectedId(null); }} className="rounded-xl lg:rounded-2xl h-12 lg:h-14 font-bold bg-slate-100 border-none dark:bg-white/5 dark:text-white">Xóa hết</Button>
                    <Button type="primary" block loading={isProcessing} onClick={async () => { setIsProcessing(true); try { await onConfirm(stickers); } finally { setIsProcessing(false); } }} className="rounded-xl lg:rounded-2xl bg-slate-900 dark:bg-blue-600 h-12 lg:h-14 font-black border-none uppercase tracking-widest text-[10px] lg:text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Lưu ngay</Button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 bg-white dark:bg-black/60 lg:rounded-[48px] flex items-center justify-center p-2 lg:p-12 overflow-hidden relative order-1 lg:order-2" onClick={() => setSelectedId(null)}>
                <div 
                    ref={containerRef} 
                    className="relative block w-fit h-fit touch-none mx-auto shadow-2xl"
                    onClick={handleCanvasClick}
                    onTouchStart={handleCanvasClick}
                >
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Photo"
                        className="max-h-[55vh] lg:max-h-[75vh] w-auto block object-contain rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-white/10 pointer-events-none select-none"
                    />

                    {/* Stickers Layer */}
                    <AnimatePresence>
                        {stickers.map((s) => (
                            <motion.div
                                key={s.id}
                                drag
                                dragMomentum={false}
                                dragConstraints={containerRef}
                                onDragEnd={(e) => handleDragEnd(e, s.id)}
                                onTap={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(s.id);
                                    playSound('click');
                                }}
                                className={`absolute sticker-item cursor-move select-none p-0 ${selectedId === s.id ? 'z-[1001]' : 'z-[1000]'}`}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: selectedId === s.id ? s.scale * 1.05 : s.scale,
                                    rotate: `${(s.rotation * 180) / Math.PI}deg`,
                                    opacity: 1,
                                    x: 0, y: 0
                                }}
                                style={{
                                    left: `${s.x}%`,
                                    top: `${s.y}%`,
                                    translateX: '-50%',
                                    translateY: '-50%',
                                    width: isEmoji(s.url) ? '12%' : '18%',
                                    touchAction: 'none'
                                }}
                            >
                                <div className={`relative group p-1 transition-all duration-300 ${selectedId === s.id ? 'opacity-100' : 'opacity-90'}`}>
                                    {isEmoji(s.url) ? (
                                        <span className="text-4xl md:text-6xl drop-shadow-lg block select-none pointer-events-none">{s.url}</span>
                                    ) : (
                                        <img
                                            src={s.url}
                                            alt="Sticker"
                                            className="w-full aspect-square object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] block pointer-events-none"
                                        />
                                    )}
                                    
                                    {selectedId === s.id && (
                                        <motion.div
                                            layoutId="active-border"
                                            className="absolute -inset-1 border-2 md:border-4 border-blue-500 rounded-xl md:rounded-3xl pointer-events-none shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                        />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Instruction for Mobile */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 md:hidden pointer-events-none">
                    <span className="text-[10px] text-white font-bold uppercase tracking-widest whitespace-nowrap">Chạm vào ảnh để chèn icon</span>
                </div>
            </div>
        </div>
    );
};
