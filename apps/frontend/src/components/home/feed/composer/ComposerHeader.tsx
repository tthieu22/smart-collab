'use client';

import {
    Globe,
    Users,
    Lock,
    ChevronDown,
    X
} from 'lucide-react';
import { Dropdown, MenuProps } from 'antd';
import { useFeedStore } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';

type Visibility = 'public' | 'friends' | 'private';

export const MOODS = [
    { emoji: '😊', label: 'Hạnh phúc', value: 'happy' },
    { emoji: '😇', label: 'Biết ơn', value: 'grateful' },
    { emoji: '🥰', label: 'Đang yêu', value: 'loved' },
    { emoji: '🤩', label: 'Hào hứng', value: 'excited' },
    { emoji: '🤔', label: 'Đang suy nghĩ', value: 'thinking' },
    { emoji: '😴', label: 'Mệt mỏi', value: 'tired' },
    { emoji: '😎', label: 'Ngầu', value: 'cool' },
    { emoji: '😤', label: 'Quyết tâm', value: 'determined' },
];

interface Props {
    onCollapse: () => void;
}

export default function ComposerHeader({ onCollapse }: Props) {
    const {
        draftVisibility,
        draftMood,
        setDraftVisibility,
        setDraftMood,
    } = useFeedStore(
        useShallow((s) => ({
            draftVisibility: s.draftVisibility,
            draftMood: s.draftMood,
            setDraftVisibility: s.setDraftVisibility,
            setDraftMood: s.setDraftMood,
        }))
    );

    const visibilityItems: MenuProps['items'] = [
        { key: 'public', label: 'Công khai', icon: <Globe size={14} /> },
        { key: 'friends', label: 'Bạn bè', icon: <Users size={14} /> },
        { key: 'private', label: 'Chỉ mình tôi', icon: <Lock size={14} /> },
    ];

    const currentVisibility = visibilityItems.find(i => i?.key === draftVisibility) as any;
    const currentMood = MOODS.find(m => m.value === draftMood);

    const moodMenu: MenuProps['items'] = MOODS.map(m => ({
        key: m.value,
        label: `${m.emoji} ${m.label}`,
        onClick: () => setDraftMood(m.value)
    }));

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Dropdown menu={{ items: visibilityItems, onClick: (e) => setDraftVisibility(e.key as Visibility) }} trigger={['click']}>
                    <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-neutral-900 text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors">
                        {currentVisibility?.icon}
                        {currentVisibility?.label}
                        <ChevronDown size={12} />
                    </button>
                </Dropdown>

                <Dropdown menu={{ items: moodMenu }} trigger={['click']}>
                    <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                        {draftMood ? `${currentMood?.emoji} ${currentMood?.label}` : 'Cảm xúc?'}
                        <ChevronDown size={12} />
                    </button>
                </Dropdown>

                {draftMood && (
                    <button
                        onClick={() => setDraftMood(null)}
                        className="text-gray-400 hover:text-red-500"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            <button
                onClick={onCollapse}
                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-full text-gray-400"
            >
                <X size={16} />
            </button>
        </div>
    );
}
