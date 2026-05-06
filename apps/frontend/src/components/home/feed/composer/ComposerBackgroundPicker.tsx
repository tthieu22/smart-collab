'use client';

import { cn } from '@smart/lib/utils';
import { useFeedStore } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';
import { Sparkles, Ban } from 'lucide-react';

export const BACKGROUNDS = [
    { name: 'None', class: '', color: 'bg-gray-200 dark:bg-neutral-800' },
    { name: 'Deep Sea', class: 'bg-gradient-to-br from-blue-600 to-blue-900 text-white', color: 'bg-blue-700' },
    { name: 'Supernova', class: 'bg-gradient-to-br from-orange-500 to-red-700 text-white', color: 'bg-orange-600' },
    { name: 'Nebula', class: 'bg-gradient-to-br from-purple-600 to-indigo-900 text-white', color: 'bg-purple-700' },
    { name: 'Galaxy', class: 'bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white', color: 'bg-gray-900' },
    { name: 'Forest Moon', class: 'bg-gradient-to-br from-emerald-600 to-green-900 text-white', color: 'bg-emerald-700' },
    { name: 'Star Dust', class: 'bg-gradient-to-br from-rose-500 to-pink-700 text-white', color: 'bg-rose-600' },
    { name: 'Solar Flare', class: 'bg-gradient-to-br from-amber-500 to-orange-700 text-white', color: 'bg-amber-600' },
    { name: 'Cyberpunk', class: 'bg-gradient-to-br from-fuchsia-600 to-cyan-700 text-white', color: 'bg-fuchsia-700' },
];

export default function ComposerBackgroundPicker() {
    const { draftBackgroundStyle, setDraftBackgroundStyle } = useFeedStore(
        useShallow((s) => ({
            draftBackgroundStyle: s.draftBackgroundStyle,
            setDraftBackgroundStyle: s.setDraftBackgroundStyle,
        }))
    );

    return (
        <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center gap-2 px-1 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <Sparkles size={10} className="text-amber-500" />
                <span>Trường tín hiệu</span>
            </div>
            <div className="flex items-center gap-2.5 px-1 py-1 overflow-x-auto custom-scrollbar no-scrollbar">
                {BACKGROUNDS.map((bg) => (
                    <button
                        key={bg.name}
                        onClick={() => setDraftBackgroundStyle(bg.class)}
                        className={cn(
                            "group relative shrink-0 w-8 h-8 rounded-full border-2 transition-all hover:scale-125 active:scale-90 shadow-md flex items-center justify-center overflow-hidden",
                            bg.color,
                            draftBackgroundStyle === bg.class ? "border-blue-500 ring-4 ring-blue-500/20 scale-110" : "border-white/10 dark:border-white/5 hover:border-white/40"
                        )}
                        title={bg.name}
                    >
                        {!bg.class && <Ban size={12} className="text-gray-400" />}
                        {bg.class && <div className={cn("absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity", bg.class)} />}
                        
                        {draftBackgroundStyle === bg.class && (
                             <div className="absolute inset-0 bg-white/10 animate-pulse" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
