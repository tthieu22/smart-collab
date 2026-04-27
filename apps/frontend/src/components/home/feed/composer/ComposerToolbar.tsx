'use client';

import {
    ImagePlus,
    Camera,
    Smile,
    Hash,
    Sparkles
} from 'lucide-react';
import { Tooltip, Popover } from 'antd';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { cn } from '@smart/lib/utils';
import { useFeedStore } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';

const QUICK_HASHTAGS = ['#SmartCollab', '#AI', '#Innovation', '#Success', '#Tech', '#Motivation'];

interface Props {
    onFileClick: () => void;
    onCameraOpen: () => void;
    isAiProcessing: boolean;
    onAiEnhance: () => void;
}

export default function ComposerToolbar({
    onFileClick,
    onCameraOpen,
    isAiProcessing,
    onAiEnhance
}: Props) {
    const { theme } = useTheme();
    const { draftText, setDraftText, isLoading } = useFeedStore(
        useShallow((s) => ({
            draftText: s.draftText,
            setDraftText: s.setDraftText,
            isLoading: s.isLoading,
        }))
    );

    const onEmojiClick = (emojiData: any) => {
        setDraftText(draftText + emojiData.emoji);
    };

    return (
        <div className="flex items-center gap-1 sm:gap-2">
            <Tooltip title="Thêm ảnh">
                <button
                    onClick={onFileClick}
                    disabled={isLoading}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-neutral-900 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                >
                    <ImagePlus size={18} />
                </button>
            </Tooltip>

            <Tooltip title="Chụp ảnh">
                <button
                    onClick={onCameraOpen}
                    disabled={isLoading}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-neutral-900 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                >
                    <Camera size={18} />
                </button>
            </Tooltip>

            <Popover
                content={
                    <EmojiPicker
                        theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                        onEmojiClick={onEmojiClick}
                    />
                }
                trigger="click"
                placement="top"
                overlayClassName="emoji-popover"
            >
                <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-neutral-900 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all">
                    <Smile size={18} />
                </button>
            </Popover>

            <Popover
                content={
                    <div className="p-1 grid grid-cols-2 gap-2">
                        {QUICK_HASHTAGS.map(h => (
                            <button
                                key={h}
                                onClick={() => setDraftText(draftText + ' ' + h)}
                                className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                {h}
                            </button>
                        ))}
                    </div>
                }
                trigger="click"
                placement="top"
            >
                <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-neutral-900 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
                    <Hash size={18} />
                </button>
            </Popover>

            <div className="w-px h-6 bg-gray-100 dark:bg-neutral-800 mx-1 hidden sm:block" />

            <Tooltip title="Tối ưu nội dung bằng AI">
                <button
                    onClick={onAiEnhance}
                    disabled={isLoading || isAiProcessing}
                    className={cn(
                        "flex items-center gap-2 px-3 h-10 rounded-xl font-bold text-xs transition-all",
                        isAiProcessing
                            ? "bg-purple-50 text-purple-600 animate-pulse"
                            : "bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40"
                    )}
                >
                    <Sparkles size={16} className={isAiProcessing ? "animate-spin" : ""} />
                    <span className="hidden md:inline">Trợ lý AI</span>
                </button>
            </Tooltip>
        </div>
    );
}
