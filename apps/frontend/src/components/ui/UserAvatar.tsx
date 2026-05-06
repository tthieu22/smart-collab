'use client';

import { useFeedStore } from '@smart/store/feed';
import { cn } from '@smart/lib/utils';
import { Popover, Tooltip, Image } from 'antd';
import { Cloud, Plus, Edit, Loader2 } from 'lucide-react';
import type { FeedUser } from '@smart/types/feed';

const MOODS = [
  { emoji: '😊', label: 'Hạnh phúc', value: 'happy' },
  { emoji: '😇', label: 'Biết ơn', value: 'grateful' },
  { emoji: '🥰', label: 'Đang yêu', value: 'loved' },
  { emoji: '🤩', label: 'Hào hứng', value: 'excited' },
  { emoji: '🤔', label: 'Đang suy nghĩ', value: 'thinking' },
  { emoji: '😴', label: 'Mệt mỏi', value: 'tired' },
  { emoji: '😎', label: 'Ngầu', value: 'cool' },
  { emoji: '😤', label: 'Quyết tâm', value: 'determined' },
  { emoji: '🍕', label: 'Đang đói', value: 'hungry' },
  { emoji: '🎮', label: 'Đang chơi game', value: 'gaming' },
  { emoji: '💻', label: 'Đang làm việc', value: 'working' },
  { emoji: '✈️', label: 'Đang du lịch', value: 'traveling' },
];

const upscaleGoogleAvatar = (url: string | null | undefined) => {
  if (!url) return url;
  if (url.includes('googleusercontent.com')) {
    // Replace =s96-c or similar with =s400-c
    return url.replace(/=s\d+(-c)?/, '=s400-c');
  }
  return url;
};

interface UserAvatarProps {
  userId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showMood?: boolean;
  allowChangeMood?: boolean;
  allowChangeAvatar?: boolean;
  isLoading?: boolean;
  mood?: string | null;
  previewable?: boolean;
}

import React, { forwardRef } from 'react';

export const UserAvatar = forwardRef<HTMLDivElement, UserAvatarProps>(({
  userId,
  size = 'md',
  className,
  showMood = true,
  allowChangeMood = false,
  allowChangeAvatar = false,
  isLoading = false,
  mood,
  previewable = false
}, ref) => {
  const user = useFeedStore((s) => s.users[userId]);
  const currentUserId = useFeedStore((s) => s.currentUserId);
  const updateUserMood = useFeedStore((s) => s.updateUserMood);

  // If user not in feed store, they might be in user store (me)
  // We'll fallback to a basic rendering if user is missing but we'll try to get it from store

  if (!user) {
    // If it's me but not in feed store yet (unlikely but possible in header)
    return null;
  }

  const isMe = userId === currentUserId;
  const displayMood = mood || user.mood;
  const currentMood = MOODS.find(m => m.value === displayMood);

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-32 w-32 text-2xl',
    '2xl': 'h-40 w-40 text-3xl',
  };

  const badgeSizeClasses = {
    xs: 'w-3 h-3 text-[8px]',
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-7 h-7 text-sm',
    xl: 'w-10 h-10 text-xl',
    '2xl': 'w-12 h-12 text-2xl',
  };

  const moodPicker = (
    <div className="grid grid-cols-4 gap-2 p-2 max-w-[200px]">
      <button
        onClick={() => updateUserMood(null)}
        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors col-span-4 border-b border-gray-100 dark:border-neutral-800 mb-1"
      >
        <span className="text-xs font-medium text-gray-500">Xóa trạng thái</span>
      </button>
      {MOODS.map((m) => (
        <Tooltip key={m.value} title={m.label}>
          <button
            onClick={() => updateUserMood(m.value)}
            className={cn(
              "flex items-center justify-center h-10 w-10 rounded-xl transition-all hover:scale-125",
              user.mood === m.value ? "bg-blue-50 dark:bg-blue-900/30 scale-110" : "hover:bg-gray-50 dark:hover:bg-neutral-800"
            )}
          >
            <span className="text-xl">{m.emoji}</span>
          </button>
        </Tooltip>
      ))}
    </div>
  );

  const MoodBadge = (isMe && allowChangeMood) ? (
    <Popover
      content={moodPicker}
      title={<span className="font-bold text-sm">Bạn đang cảm thấy thế nào?</span>}
      trigger="click"
      placement="topRight"
      overlayClassName="mood-popover"
    >
      <div className={cn(
        "absolute -bottom-1 -right-1 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center shadow-sm ring-1 ring-black/5 transition-all hover:scale-110 cursor-pointer hover:ring-blue-500/50 z-10",
        badgeSizeClasses[size]
      )}>
        {displayMood ? (
          <span>{currentMood?.emoji || '✨'}</span>
        ) : (
          <div className="flex items-center justify-center text-blue-500">
            <Cloud size={size === 'xs' || size === 'sm' ? 10 : 12} className="relative" />
            <Plus size={size === 'xs' || size === 'sm' ? 6 : 8} className="absolute" />
          </div>
        )}
      </div>
    </Popover>
  ) : (
    showMood && displayMood && (
      <div className={cn(
        "absolute -bottom-1 -right-1 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center shadow-sm ring-1 ring-black/5",
        badgeSizeClasses[size]
      )}>
        <span>{currentMood?.emoji || '✨'}</span>
      </div>
    )
  );

  return (
    <div ref={ref} className={cn("relative group shrink-0 inline-block rounded-full", sizeClasses[size], className)}>
      <div className={cn(
        "relative h-full w-full shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-neutral-800 shadow-sm bg-gray-100 dark:bg-neutral-900"
      )}>
        {user.avatarUrl ? (
          previewable ? (
            <Image
              src={upscaleGoogleAvatar(user.avatarUrl) || ''}
              alt={user.name}
              className="!w-full !h-full object-cover transition-transform group-hover:scale-110 !rounded-full avatar-image"
              wrapperClassName="!h-full !w-full !rounded-full avatar-image-wrapper"
              style={{ borderRadius: '50%', width: '100%', height: '100%' }}
              wrapperStyle={{ borderRadius: '50%', overflow: 'hidden', width: '100%', height: '100%' }}
              preview={{ mask: null }}
            />
          ) : (
            <img
              src={upscaleGoogleAvatar(user.avatarUrl) || ''}
              alt={user.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold uppercase">
            {user.name ? user.name.charAt(0) : (user.email ? user.email.charAt(0) : '?')}
          </div>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20 rounded-full">
            <Loader2 className="animate-spin text-white" size={size === '2xl' ? 32 : 20} />
          </div>
        )}
        
        {isMe && allowChangeAvatar && (
          <>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById(`avatar-upload-${userId}`)?.click();
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
            >
              <div className="flex flex-col items-center gap-1 text-white scale-90 group-hover:scale-100 transition-transform">
                <Edit size={size === '2xl' ? 24 : 16} strokeWidth={2.5} />
                <span className={cn("font-black uppercase tracking-widest", size === '2xl' ? "text-[8px]" : "text-[6px]")}>Thay đổi</span>
              </div>
            </div>
            <input
              id={`avatar-upload-${userId}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const event = new CustomEvent('upload-avatar', { detail: { file } });
                  window.dispatchEvent(event);
                }
              }}
            />
          </>
        )}
      </div>
      {MoodBadge}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
