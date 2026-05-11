'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Check, RotateCcw, X as CloseIcon, Music, ChevronUp, ChevronDown, Trash2, Edit3, Layers, RefreshCw, ChevronLeft } from 'lucide-react';
import { Button } from 'antd';
import { Sticker } from './types';
import { playSound } from './sounds';

interface StickerEditorProps {
    imageUrl: string;
    onConfirm: (stickers: Sticker[]) => void;
    onCancel: () => void;
}

const STICKER_OPTIONS = [
    // 1-10: Expressive Faces (Colorful)
    { id: 's1', url: 'https://cdn-icons-png.flaticon.com/512/742/742751.png' },
    { id: 's2', url: 'https://cdn-icons-png.flaticon.com/512/742/742752.png' },
    { id: 's3', url: 'https://cdn-icons-png.flaticon.com/512/742/742753.png' },
    { id: 's4', url: 'https://cdn-icons-png.flaticon.com/512/742/742754.png' },
    { id: 's5', url: 'https://cdn-icons-png.flaticon.com/512/742/742755.png' },
    { id: 's6', url: 'https://cdn-icons-png.flaticon.com/512/742/742756.png' },
    { id: 's7', url: 'https://cdn-icons-png.flaticon.com/512/742/742757.png' },
    { id: 's8', url: 'https://cdn-icons-png.flaticon.com/512/742/742758.png' },
    { id: 's9', url: 'https://cdn-icons-png.flaticon.com/512/742/742759.png' },
    { id: 's10', url: 'https://cdn-icons-png.flaticon.com/512/742/742760.png' },
    
    // 11-20: Colorful Hearts & Love
    { id: 's11', url: 'https://cdn-icons-png.flaticon.com/512/2107/2107845.png' },
    { id: 's12', url: 'https://cdn-icons-png.flaticon.com/512/2107/2107952.png' },
    { id: 's13', url: 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png' },
    { id: 's14', url: 'https://cdn-icons-png.flaticon.com/512/2589/2589197.png' },
    { id: 's15', url: 'https://cdn-icons-png.flaticon.com/512/1182/1182660.png' },
    { id: 's16', url: 'https://cdn-icons-png.flaticon.com/512/1182/1182664.png' },
    { id: 's17', url: 'https://cdn-icons-png.flaticon.com/512/1182/1182669.png' },
    { id: 's18', url: 'https://cdn-icons-png.flaticon.com/512/1182/1182672.png' },
    { id: 's19', url: 'https://cdn-icons-png.flaticon.com/512/833/833472.png' },
    { id: 's20', url: 'https://cdn-icons-png.flaticon.com/512/833/833476.png' },

    // 21-30: Colorful Stars & Sparkles
    { id: 's21', url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' }, // Gold Star
    { id: 's22', url: 'https://cdn-icons-png.flaticon.com/512/477/477406.png' },  // Shiny Star
    { id: 's23', url: 'https://cdn-icons-png.flaticon.com/512/1040/1040230.png' }, // Rainbow Cloud
    { id: 's24', url: 'https://cdn-icons-png.flaticon.com/512/933/933351.png' },  // Magic Wand
    { id: 's25', url: 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png' }, // Diamond
    { id: 's26', url: 'https://cdn-icons-png.flaticon.com/512/2618/2618312.png' }, // Sparkles
    { id: 's27', url: 'https://cdn-icons-png.flaticon.com/512/414/414927.png' },  // Small Rainbow
    { id: 's28', url: 'https://cdn-icons-png.flaticon.com/512/2271/2271060.png' }, // Firework
    { id: 's29', url: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }, // Light Bulb
    { id: 's30', url: 'https://cdn-icons-png.flaticon.com/512/3208/3208710.png' }, // Colorful Balloon

    // 31-40: Colorful Animals & Fun
    { id: 's31', url: 'https://cdn-icons-png.flaticon.com/512/1998/1998592.png' }, // Tiger
    { id: 's32', url: 'https://cdn-icons-png.flaticon.com/512/1998/1998614.png' }, // Panda
    { id: 's33', url: 'https://cdn-icons-png.flaticon.com/512/1998/1998620.png' }, // Monkey
    { id: 's34', url: 'https://cdn-icons-png.flaticon.com/512/2271/2271002.png' }, // Balloons
    { id: 's35', url: 'https://cdn-icons-png.flaticon.com/512/2271/2271030.png' }, // Party Cake
    { id: 's36', url: 'https://cdn-icons-png.flaticon.com/512/2271/2271038.png' }, // Gift
    { id: 's37', url: 'https://cdn-icons-png.flaticon.com/512/2271/2271057.png' }, // Party Hat
    { id: 's38', url: 'https://cdn-icons-png.flaticon.com/512/2271/2271060.png' }, // Firework
    { id: 's39', url: 'https://cdn-icons-png.flaticon.com/512/941/941769.png' },  // Lollipop
    { id: 's40', url: 'https://cdn-icons-png.flaticon.com/512/941/941773.png' },  // Candy

    // 41-50: Vibrant Misc & Treats
    { id: 's41', url: 'https://cdn-icons-png.flaticon.com/512/414/414927.png' }, // Rainbow
    { id: 's42', url: 'https://cdn-icons-png.flaticon.com/512/658/658498.png' }, // Sunglasses
    { id: 's43', url: 'https://cdn-icons-png.flaticon.com/512/305/305807.png' }, // Donut
    { id: 's44', url: 'https://cdn-icons-png.flaticon.com/512/933/933310.png' }, // Ice cream
    { id: 's45', url: 'https://cdn-icons-png.flaticon.com/512/541/541415.png' }, // Watermelon
    { id: 's46', url: 'https://cdn-icons-png.flaticon.com/512/1155/1155262.png' }, // Pizza
    { id: 's47', url: 'https://cdn-icons-png.flaticon.com/512/1155/1155288.png' }, // Cupcake
    { id: 's48', url: 'https://cdn-icons-png.flaticon.com/512/1155/1155281.png' }, // Burger
    { id: 's49', url: 'https://cdn-icons-png.flaticon.com/512/1155/1155295.png' }, // Taco
    { id: 's50', url: 'https://cdn-icons-png.flaticon.com/512/414/414966.png' }, // Sun

    // 51-60: More Expressive Faces
    { id: 's51', url: 'https://cdn-icons-png.flaticon.com/512/742/742861.png' },
    { id: 's52', url: 'https://cdn-icons-png.flaticon.com/512/742/742862.png' },
    { id: 's53', url: 'https://cdn-icons-png.flaticon.com/512/742/742863.png' },
    { id: 's54', url: 'https://cdn-icons-png.flaticon.com/512/742/742864.png' },
    { id: 's55', url: 'https://cdn-icons-png.flaticon.com/512/742/742865.png' },
    { id: 's56', url: 'https://cdn-icons-png.flaticon.com/512/742/742866.png' },
    { id: 's57', url: 'https://cdn-icons-png.flaticon.com/512/742/742867.png' },
    { id: 's58', url: 'https://cdn-icons-png.flaticon.com/512/742/742868.png' },
    { id: 's59', url: 'https://cdn-icons-png.flaticon.com/512/742/742869.png' },
    { id: 's60', url: 'https://cdn-icons-png.flaticon.com/512/742/742870.png' },

    // 61-70: Travel & Adventure
    { id: 's61', url: 'https://cdn-icons-png.flaticon.com/512/201/201623.png' },  // Plane
    { id: 's62', url: 'https://cdn-icons-png.flaticon.com/512/826/826070.png' },  // Camera
    { id: 's63', url: 'https://cdn-icons-png.flaticon.com/512/2903/2903541.png' }, // Globe
    { id: 's64', url: 'https://cdn-icons-png.flaticon.com/512/4127/4127281.png' }, // Map
    { id: 's65', url: 'https://cdn-icons-png.flaticon.com/512/3145/3145827.png' }, // Tent
    { id: 's66', url: 'https://cdn-icons-png.flaticon.com/512/2983/2983804.png' }, // Compass
    { id: 's67', url: 'https://cdn-icons-png.flaticon.com/512/2942/2942001.png' }, // Luggage
    { id: 's68', url: 'https://cdn-icons-png.flaticon.com/512/3006/3006655.png' }, // Backpack
    { id: 's69', url: 'https://cdn-icons-png.flaticon.com/512/2736/2736934.png' }, // Mountain
    { id: 's70', url: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png' }, // Beach Ball

    // 71-80: Sports & Hobbies
    { id: 's71', url: 'https://cdn-icons-png.flaticon.com/512/889/889590.png' },  // Soccer
    { id: 's72', url: 'https://cdn-icons-png.flaticon.com/512/889/889577.png' },  // Basketball
    { id: 's73', url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' }, // Controller
    { id: 's74', url: 'https://cdn-icons-png.flaticon.com/512/2405/2405463.png' }, // Guitar
    { id: 's75', url: 'https://cdn-icons-png.flaticon.com/512/3843/3843033.png' }, // Headphones
    { id: 's76', url: 'https://cdn-icons-png.flaticon.com/512/2972/2972130.png' }, // Roller Skate
    { id: 's77', url: 'https://cdn-icons-png.flaticon.com/512/3163/3163473.png' }, // Skateboard
    { id: 's78', url: 'https://cdn-icons-png.flaticon.com/512/3330/3330314.png' }, // Bicycle
    { id: 's79', url: 'https://cdn-icons-png.flaticon.com/512/3393/3393357.png' }, // Paint Palette
    { id: 's80', url: 'https://cdn-icons-png.flaticon.com/512/2933/2933839.png' }, // Book

    // 81-90: Weather & Cosmos
    { id: 's81', url: 'https://cdn-icons-png.flaticon.com/512/1163/1163624.png' }, // Sun & Cloud
    { id: 's82', url: 'https://cdn-icons-png.flaticon.com/512/1163/1163661.png' }, // Moon & Stars
    { id: 's83', url: 'https://cdn-icons-png.flaticon.com/512/1163/1163634.png' }, // Rain
    { id: 's84', url: 'https://cdn-icons-png.flaticon.com/512/1163/1163653.png' }, // Thunder
    { id: 's85', url: 'https://cdn-icons-png.flaticon.com/512/1163/1163646.png' }, // Snow
    { id: 's86', url: 'https://cdn-icons-png.flaticon.com/512/1163/1163666.png' }, // Wind
    { id: 's87', url: 'https://cdn-icons-png.flaticon.com/512/2913/2913453.png' }, // Trophy
    { id: 's88', url: 'https://cdn-icons-png.flaticon.com/512/3208/3208710.png' }, // Balloon
    { id: 's89', url: 'https://cdn-icons-png.flaticon.com/512/2107/2107845.png' }, // Heart
    { id: 's90', url: 'https://cdn-icons-png.flaticon.com/512/414/414966.png' }, // Sun

    // 91-100: Miscellaneous Fun
    { id: 's91', url: 'https://cdn-icons-png.flaticon.com/512/2913/2913504.png' }, // Fire
    { id: 's92', url: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png' }, // Diamond
    { id: 's93', url: 'https://cdn-icons-png.flaticon.com/512/2913/2913564.png' }, // Crown
    { id: 's94', url: 'https://cdn-icons-png.flaticon.com/512/2913/2913453.png' }, // Trophy
    { id: 's95', url: 'https://cdn-icons-png.flaticon.com/512/2913/2913444.png' }, // Medal
    { id: 's96', url: 'https://cdn-icons-png.flaticon.com/512/2913/2913490.png' }, // Key
    { id: 's97', url: 'https://cdn-icons-png.flaticon.com/512/2913/2913481.png' }, // Lock
    { id: 's98', url: 'https://cdn-icons-png.flaticon.com/512/2913/2913470.png' }, // Bell
    { id: 's99', url: 'https://cdn-icons-png.flaticon.com/512/2913/2913462.png' }, // Clock
    { id: 's100', url: 'https://cdn-icons-png.flaticon.com/512/2913/2913433.png' }, // Bulb
];

export const StickerEditor: React.FC<StickerEditorProps> = ({ imageUrl, onConfirm, onCancel }) => {
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [customIcon, setCustomIcon] = useState('');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [lastClickPos, setLastClickPos] = useState({ x: 50, y: 50 });

    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const addSticker = (url: string) => {
        playSound('click');
        const newSticker: Sticker = {
            id: 'stk-' + Date.now(),
            url,
            x: lastClickPos.x,
            y: lastClickPos.y,
            scale: 1,
            rotation: 0
        };
        setStickers(prev => [...prev, newSticker]);
        setSelectedId(newSticker.id);
        setIsLibraryOpen(false);
    };

    const lastClickRef = useRef<number>(0);

    const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current || !imageRef.current) return;
        
        // If clicking on an existing sticker, handle selection instead of adding new
        const target = e.target as HTMLElement;
        if (target.closest('.sticker-item')) return;

        const now = Date.now();
        const isDoubleClick = now - lastClickRef.current < 300;
        lastClickRef.current = now;

        if (!isDoubleClick) {
            // Single click: just deselect
            setSelectedId(null);
            return;
        }

        // Double click: open library
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
            setLastClickPos({ x, y });
            setIsLibraryOpen(true);
            setSelectedId(null);
        }
    };

    const handleCustomIconSubmit = () => {
        if (customIcon.trim()) {
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
        
        const centerX = stickerRect.left + stickerRect.width / 2;
        const centerY = stickerRect.top + stickerRect.height / 2;

        const newX = ((centerX - rect.left) / rect.width) * 100;
        const newY = ((centerY - rect.top) / rect.height) * 100;
        
        updateSticker(id, { x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) });
    };

    const selectedSticker = stickers.find(s => s.id === selectedId);
    const isEmoji = (url: string) => !url.startsWith('http') && url.length <= 4;

    return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden transition-colors duration-500">
            {/* Top Toolbar - Theme synced */}
            <div className="absolute top-0 left-0 right-0 z-50 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-white/90 dark:from-black/90 to-transparent pointer-events-none">
                <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
                    <button onClick={onCancel} className="h-9 sm:h-10 px-4 rounded-full bg-slate-200 dark:bg-white/10 backdrop-blur-md flex items-center gap-2 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-all border border-slate-300/50 dark:border-white/5 font-bold text-[10px] uppercase tracking-widest">
                        <ChevronLeft size={16} />
                        <span>Quay lại</span>
                    </button>
                    <div className="hidden xs:block">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xs sm:text-sm leading-none">Editor</h3>
                        <p className="text-[8px] sm:text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Stickers & Layers</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
                    <button onClick={() => { setStickers([]); setSelectedId(null); }} className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-slate-200 dark:bg-white/10 backdrop-blur-md text-slate-800 dark:text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-white/20 transition-all flex items-center gap-1.5 sm:gap-2 border border-slate-300/50 dark:border-white/5">
                        <RotateCcw size={12} className="sm:w-3.5 sm:h-3.5" />
                        <span className="hidden xxs:inline">Xóa hết</span>
                    </button>
                    <button 
                        disabled={isProcessing}
                        onClick={async () => { 
                            setIsProcessing(true); 
                            try { await onConfirm(stickers); } 
                            finally { setIsProcessing(false); } 
                        }} 
                        className="px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl bg-blue-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2"
                    >
                        {isProcessing ? <RefreshCw size={12} className="animate-spin sm:w-3.5 sm:h-3.5" /> : <Check size={12} className="sm:w-3.5 sm:h-3.5" />}
                        Lưu ngay
                    </button>
                </div>
            </div>

            {/* Main Canvas Area - Improved desktop layout to avoid overflow/pixelation */}
            <div 
                className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 sm:p-8 md:p-12 lg:p-16 flex items-start sm:items-center justify-center custom-scrollbar" 
                style={{ paddingBottom: '300px' }} // Dynamic padding for scroll room on mobile
                onClick={() => setSelectedId(null)}
            >
                <div 
                    ref={containerRef} 
                    className="relative block w-fit h-fit touch-none mx-auto shadow-2xl my-24 sm:my-8 lg:my-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCanvasClick(e);
                    }}
                >
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Photo"
                        className="max-w-[92vw] sm:max-w-[80vw] lg:max-w-[60vw] xl:max-w-[50vw] max-h-[75vh] sm:max-h-[80vh] h-auto w-auto block object-contain rounded-xl sm:rounded-2xl lg:rounded-[32px] border border-slate-200 dark:border-white/10 pointer-events-none select-none shadow-2xl bg-white dark:bg-slate-900"
                    />

                    {/* Stickers Layer */}
                    <AnimatePresence>
                        {stickers.map((s, index) => (
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
                                className="absolute sticker-item cursor-move select-none p-0"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: selectedId === s.id ? s.scale * 1.05 : s.scale,
                                    rotate: `${(s.rotation * 180) / Math.PI}deg`,
                                    opacity: 1,
                                    zIndex: selectedId === s.id ? 1000 + index : index
                                }}
                                style={{
                                    left: `${s.x}%`,
                                    top: `${s.y}%`,
                                    x: '-50%',
                                    y: '-50%',
                                    width: isEmoji(s.url) ? '12%' : '18%',
                                    maxWidth: '120px',
                                    touchAction: 'none'
                                }}
                            >
                                <div className={`relative group p-1 transition-all duration-300 ${selectedId === s.id ? 'opacity-100' : 'opacity-90'}`}>
                                    {isEmoji(s.url) ? (
                                        <span className="text-3xl sm:text-6xl drop-shadow-lg block select-none pointer-events-none">{s.url}</span>
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
                                            className="absolute -inset-1 border-2 sm:border-4 border-blue-500 rounded-lg sm:rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                        />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Compact Adjustment Panel (Floating) - Theme synced */}
            <AnimatePresence>
                {selectedSticker && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-0 sm:bottom-6 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 z-[5000] w-full sm:w-[90vw] max-w-sm sm:px-0"
                        onClick={(e) => e.stopPropagation()} // Prevent deselection when clicking panel
                    >
                        <div className="bg-white dark:bg-slate-900 backdrop-blur-2xl rounded-t-[24px] sm:rounded-[32px] p-5 sm:p-6 border-t sm:border border-slate-200 dark:border-white/10 shadow-[0_-15px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-500/10 dark:bg-blue-600/20 rounded-lg flex items-center justify-center">
                                        <Edit3 size={14} className="text-blue-600 dark:text-blue-500" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Căn chỉnh</span>
                                </div>
                                <button onClick={() => setSelectedId(null)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                                    <Check size={18} className="text-blue-600 dark:text-blue-500" />
                                </button>
                            </div>

                            <div className="space-y-5 sm:space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2.5 sm:mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">
                                        <span>Kích thước</span>
                                        <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px]">{Math.round(selectedSticker.scale * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min="0.2" max="3" step="0.1"
                                        value={selectedSticker.scale}
                                        onChange={(e) => updateSticker(selectedId!, { scale: parseFloat(e.target.value) })}
                                        className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full appearance-none accent-blue-500 cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2.5 sm:mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">
                                        <span>Góc xoay</span>
                                        <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px]">{Math.round((selectedSticker.rotation * 180) / Math.PI)}°</span>
                                    </div>
                                    <input
                                        type="range" min={-Math.PI} max={Math.PI} step="0.1"
                                        value={selectedSticker.rotation}
                                        onChange={(e) => updateSticker(selectedId!, { rotation: parseFloat(e.target.value) })}
                                        className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full appearance-none accent-blue-500 cursor-pointer"
                                    />
                                </div>
                                <div className="flex gap-2.5 pt-1 sm:pt-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); moveLayer(selectedId!, 'down'); }} 
                                        className="flex-1 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white active:scale-95"
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); moveLayer(selectedId!, 'up'); }} 
                                        className="flex-1 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white active:scale-95"
                                    >
                                        <ChevronUp size={18} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setStickers(prev => prev.filter(s => s.id !== selectedId)); setSelectedId(null); }} 
                                        className="flex-1 h-12 bg-red-500/10 text-red-600 dark:text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-500/20 active:scale-95"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Library Modal - Theme synced */}
            <AnimatePresence>
                {isLibraryOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center sm:p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md"
                            onClick={() => setIsLibraryOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-t-[32px] sm:rounded-[40px] p-6 sm:p-8 relative z-10 shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar"
                        >
                            {/* Drag handle for mobile */}
                            <div className="w-12 h-1 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />

                            <div className="flex items-center justify-between mb-6 sm:mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Smile size={18} className="text-white sm:w-5 sm:h-5" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Chọn Sticker</h3>
                                </div>
                                <button onClick={() => setIsLibraryOpen(false)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/60">
                                    <CloseIcon size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            <div className="space-y-6 sm:space-y-8">
                                <div className="flex flex-col gap-2 sm:gap-3">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 dark:text-white/40 tracking-widest">Nhập Emoji tùy chỉnh</p>
                                    <div className="flex gap-2">
                                        <input 
                                            placeholder="Gõ emoji hoặc icon..." 
                                            value={customIcon}
                                            onChange={e => setCustomIcon(e.target.value)}
                                            className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-6 h-12 sm:h-14 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                                            onKeyDown={e => e.key === 'Enter' && handleCustomIconSubmit()}
                                        />
                                        <button 
                                            onClick={handleCustomIconSubmit}
                                            className="bg-blue-600 text-white px-5 sm:px-8 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            Thêm
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 dark:text-white/40 tracking-widest">Thư viện gợi ý</p>
                                    <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 gap-2 sm:gap-3">
                                        {STICKER_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => addSticker(opt.url)}
                                                className="aspect-square rounded-xl sm:rounded-2xl p-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-blue-500/50 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-90 group"
                                            >
                                                <img src={opt.url} alt="Sticker" className="w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating Instruction - Theme synced & Compact */}
            {!selectedId && !isLibraryOpen && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-white/10 backdrop-blur-2xl px-4 sm:px-6 py-2 sm:py-3 rounded-2xl sm:rounded-full border border-slate-200 dark:border-white/10 pointer-events-none animate-bounce shadow-xl ring-1 ring-black/5 dark:ring-white/5">
                    <span className="text-[8px] sm:text-[10px] text-slate-900 dark:text-white font-bold sm:font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] whitespace-nowrap">Chạm 2 lần để thêm Sticker</span>
                </div>
            )}
        </div>
    );
};
