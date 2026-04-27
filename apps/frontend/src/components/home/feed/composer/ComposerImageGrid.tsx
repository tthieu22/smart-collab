'use client';

import { X } from 'lucide-react';
import { useFeedStore } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';

export default function ComposerImageGrid() {
    const { draftImages, removeDraftImage, isLoading } = useFeedStore(
        useShallow((s) => ({
            draftImages: s.draftImages,
            removeDraftImage: s.removeDraftImage,
            isLoading: s.isLoading,
        }))
    );

    if (draftImages.length === 0) return null;

    return (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {draftImages.map((img, idx) => (
                <div key={`${img.preview}-${idx}`} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm">
                    <img src={img.preview} alt={`draft-${idx}`} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    <button
                        onClick={() => removeDraftImage(idx)}
                        disabled={isLoading}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-50"
                        type="button"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
