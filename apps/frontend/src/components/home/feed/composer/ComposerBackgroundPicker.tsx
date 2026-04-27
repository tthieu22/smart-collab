'use client';

import { cn } from '@smart/lib/utils';
import { useFeedStore } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';

export const BACKGROUNDS = [
    { name: 'None', class: '' },
    { name: 'Ocean', class: 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' },
    { name: 'Sunset', class: 'bg-gradient-to-br from-orange-400 to-red-500 text-white' },
    { name: 'Purple', class: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' },
    { name: 'Nature', class: 'bg-gradient-to-br from-emerald-400 to-green-600 text-white' },
    { name: 'Dark', class: 'bg-gradient-to-br from-gray-800 to-black text-white' },
    { name: 'Pink', class: 'bg-gradient-to-br from-rose-400 to-pink-600 text-white' },
    { name: 'Gold', class: 'bg-gradient-to-br from-amber-400 to-orange-600 text-white' },
    { name: 'Neon', class: 'bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white' },
];

export default function ComposerBackgroundPicker() {
    const { draftBackgroundStyle, setDraftBackgroundStyle } = useFeedStore(
        useShallow((s) => ({
            draftBackgroundStyle: s.draftBackgroundStyle,
            setDraftBackgroundStyle: s.setDraftBackgroundStyle,
        }))
    );

    return (
        <div className="flex items-center gap-2 py-2">
            {BACKGROUNDS.map((bg) => (
                <button
                    key={bg.name}
                    onClick={() => setDraftBackgroundStyle(bg.class)}
                    className={cn(
                        "w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 shadow-sm",
                        bg.class || "bg-gray-200 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700",
                        draftBackgroundStyle === bg.class ? "border-blue-500 scale-110 shadow-lg ring-2 ring-blue-500/10" : "border-transparent"
                    )}
                    title={bg.name}
                />
            ))}
        </div>
    );
}
