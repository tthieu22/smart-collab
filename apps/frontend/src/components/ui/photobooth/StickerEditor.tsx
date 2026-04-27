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

    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const addSticker = (url: string) => {
        playSound('click');
        const newSticker: Sticker = {
            id: 'stk-' + Date.now(),
            url,
            x: 50, y: 50, scale: 1, rotation: 0
        };
        setStickers(prev => [...prev, newSticker]);
        setSelectedId(newSticker.id);
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

    const handleDragEnd = (id: string, info: any) => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const newX = ((info.point.x - rect.left) / rect.width) * 100;
        const newY = ((info.point.y - rect.top) / rect.height) * 100;
        updateSticker(id, { x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) });
    };

    const selectedSticker = stickers.find(s => s.id === selectedId);

    return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-hidden">
            {/* Sidebar Modernized */}
            <div className="w-full md:w-80 bg-white dark:bg-slate-900 rounded-[32px] p-6 flex flex-col border border-slate-200 dark:border-white/10 shrink-0 shadow-2xl overflow-hidden z-20">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Smile className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-lg leading-none">Editor</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Stickers & Layers</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-8 pr-1">
                    {/* PRIORITY: Adjustment Controls (Top-positioned when active) */}
                    <AnimatePresence mode="wait">
                        {selectedSticker ? (
                            <motion.section
                                key="adjust"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-blue-600 rounded-[24px] p-6 text-white shadow-xl shadow-blue-500/20"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Edit3 size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Đang chỉnh sửa</span>
                                    </div>
                                    <button onClick={() => setSelectedId(null)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                                        <CloseIcon size={16} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-3 text-[11px] font-bold uppercase tracking-wide">
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
                                        <div className="flex justify-between items-center mb-3 text-[11px] font-bold uppercase tracking-wide">
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
                                        <button onClick={() => moveLayer(selectedId!, 'down')} className="flex-1 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"><ChevronDown size={20} /></button>
                                        <button onClick={() => moveLayer(selectedId!, 'up')} className="flex-1 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"><ChevronUp size={20} /></button>
                                        <button onClick={() => { setStickers(prev => prev.filter(s => s.id !== selectedId)); setSelectedId(null); }} className="flex-1 h-12 bg-red-400/90 text-white rounded-xl flex items-center justify-center hover:bg-red-500 transition-all shadow-lg"><Trash2 size={20} /></button>
                                    </div>
                                </div>
                            </motion.section>
                        ) : (
                            <motion.section
                                key="library"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Layers size={14} className="text-slate-400" />
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Thư viện Sticker</p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {STICKER_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => addSticker(opt.url)}
                                            className="aspect-square bg-slate-50 dark:bg-white/5 rounded-2xl p-2 hover:translate-y-[-4px] hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-white/5 active:scale-95 group"
                                        >
                                            <img src={opt.url} alt="Icon" className="w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md" />
                                        </button>
                                    ))}
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <Button block onClick={() => { setStickers([]); setSelectedId(null); }} icon={<RotateCcw size={16} />} className="rounded-2xl h-12 font-bold bg-slate-100 border-none dark:bg-white/5 dark:text-white">Xóa trắng</Button>
                    <Button type="primary" block loading={isProcessing} onClick={async () => { setIsProcessing(true); try { await onConfirm(stickers); } finally { setIsProcessing(false); } }} icon={<Check size={18} />} className="rounded-2xl bg-slate-900 dark:bg-blue-600 h-16 font-black border-none uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Lưu ảnh ngay 🚀</Button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 bg-white dark:bg-black/40 rounded-[48px] flex items-center justify-center p-4 md:p-12 border border-slate-200 dark:border-white/5 overflow-hidden relative" onClick={() => setSelectedId(null)}>
                <div ref={containerRef} className="relative inline-block">
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Photo"
                        className="max-h-[70vh] md:max-h-[85vh] object-contain rounded-3xl border-[12px] border-white dark:border-neutral-900 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] pointer-events-none"
                    />

                    {/* Stickers Layer */}
                    <AnimatePresence>
                        {stickers.map((s) => (
                            <motion.div
                                key={s.id}
                                drag
                                dragMomentum={false}
                                dragConstraints={containerRef}
                                onDragEnd={(_, info) => handleDragEnd(s.id, info)}
                                onTap={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(s.id);
                                    playSound('click');
                                }}
                                className={`absolute cursor-move select-none p-0 ${selectedId === s.id ? 'z-[1001]' : 'z-[1000]'}`}
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
                                    width: '18%',
                                    touchAction: 'none'
                                }}
                            >
                                <div className={`relative group p-2 transition-all duration-300 ${selectedId === s.id ? 'opacity-100' : 'opacity-90'}`}>
                                    <img
                                        src={s.url}
                                        alt="Sticker"
                                        className="w-full aspect-square object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] block pointer-events-none"
                                    />
                                    {selectedId === s.id && (
                                        <motion.div
                                            layoutId="active-border"
                                            className="absolute -inset-1 border-4 border-blue-500 rounded-3xl pointer-events-none shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                        />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
