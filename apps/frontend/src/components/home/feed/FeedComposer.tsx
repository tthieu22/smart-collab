'use client';

import { useMemo, useRef, useState } from 'react';
import { Card } from '@smart/components/ui/card';
import { Button } from '@smart/components/ui/button';
import { useFeedStore, type DraftImage } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';
import UserAvatar from '@smart/components/ui/UserAvatar';
import {
  Camera,
  ImagePlus,
  Send,
  X,
  Link as LinkIcon,
  Type,
  Sparkles,
  Globe,
  Users,
  Lock,
  ChevronDown,
  Smile,
  Hash,
  Palette,
  Layout
} from 'lucide-react';
import { cn } from '@smart/lib/utils';
import { Dropdown, MenuProps, Tooltip, message, Popover } from 'antd';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { CameraModal } from '@smart/components/ui/CameraModal';


type Visibility = 'public' | 'friends' | 'private';

const MOODS = [
  { emoji: '😊', label: 'Hạnh phúc', value: 'happy' },
  { emoji: '😇', label: 'Biết ơn', value: 'grateful' },
  { emoji: '🥰', label: 'Đang yêu', value: 'loved' },
  { emoji: '🤩', label: 'Hào hứng', value: 'excited' },
  { emoji: '🤔', label: 'Đang suy nghĩ', value: 'thinking' },
  { emoji: '😴', label: 'Mệt mỏi', value: 'tired' },
  { emoji: '😎', label: 'Ngầu', value: 'cool' },
  { emoji: '😤', label: 'Quyết tâm', value: 'determined' },
];

const BACKGROUNDS = [
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

const QUICK_HASHTAGS = ['#SmartCollab', '#AI', '#Innovation', '#Success', '#Tech', '#Motivation'];

export default function FeedComposer() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();

  const {
    draftTitle,
    draftText,
    draftLinkUrl,
    draftImages,
    draftVisibility,
    draftMood,
    draftBackgroundStyle,
    setDraftTitle,
    setDraftText,
    setDraftLinkUrl,
    addDraftImages,
    removeDraftImage,
    setDraftVisibility,
    setDraftMood,
    setDraftBackgroundStyle,
    publishDraft,
    me,
    isLoading,
  } = useFeedStore(
    useShallow((s) => ({
      draftTitle: s.draftTitle,
      draftText: s.draftText,
      draftLinkUrl: s.draftLinkUrl,
      draftImages: s.draftImages,
      draftVisibility: s.draftVisibility,
      draftMood: s.draftMood,
      draftBackgroundStyle: s.draftBackgroundStyle,
      setDraftTitle: s.setDraftTitle,
      setDraftText: s.setDraftText,
      setDraftLinkUrl: s.setDraftLinkUrl,
      addDraftImages: s.addDraftImages,
      removeDraftImage: s.removeDraftImage,
      setDraftVisibility: s.setDraftVisibility,
      setDraftMood: s.setDraftMood,
      setDraftBackgroundStyle: s.setDraftBackgroundStyle,
      publishDraft: s.publishDraft,
      me: s.currentUserId ? s.users[s.currentUserId] : null,
      isLoading: s.isLoading,
    }))
  );

  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const canPost = useMemo(
    () => draftText.trim().length > 0 || draftImages.length > 0,
    [draftText, draftImages.length],
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const images = await Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<DraftImage>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ preview: String(reader.result || ''), file });
            reader.readAsDataURL(file);
          }),
      ),
    );
    addDraftImages(images.filter((img) => img.preview));
    setIsExpanded(true);
  };

  const handleAiEnhance = async () => {
    if (!draftText.trim()) {
      message.info('Vui lòng nhập nội dung để AI có thể hỗ trợ bạn.');
      return;
    }
    setIsAiProcessing(true);
    // Real-ish AI process mock
    setTimeout(() => {
      const enhancedText = draftText + "\n\n" + QUICK_HASHTAGS.slice(0, 2).join(' ');
      setDraftText(enhancedText);
      setIsAiProcessing(false);
      message.success('Đã tối ưu nội dung bằng AI!');
    }, 1500);
  };

  const visibilityItems: MenuProps['items'] = [
    { key: 'public', label: 'Công khai', icon: <Globe size={14} /> },
    { key: 'friends', label: 'Bạn bè', icon: <Users size={14} /> },
    { key: 'private', label: 'Chỉ mình tôi', icon: <Lock size={14} /> },
  ];

  const currentVisibility = visibilityItems.find(i => i?.key === draftVisibility) as any;
  const currentMood = MOODS.find(m => m.value === draftMood);

  const onEmojiClick = (emojiData: any) => {
    setDraftText(draftText + emojiData.emoji);
  };

  const handleCameraCapture = (file: File) => {
    handleFiles([file] as any);
  };


  const moodMenu: MenuProps['items'] = MOODS.map(m => ({
    key: m.value,
    label: `${m.emoji} ${m.label}`,
    onClick: () => setDraftMood(m.value)
  }));

  return (
    <Card
      padding="none"
      className={cn(
        "dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5 shadow-sm rounded-[24px] overflow-hidden transition-all duration-500",
        isExpanded ? "ring-2 ring-blue-500/20 shadow-xl" : ""
      )}
    >
      <div className="p-3 space-y-3">
        {/* COMPACT VIEW (Avatar + Input) */}
        <div className="flex items-start gap-4">
          <div className="relative group">
            <UserAvatar
              userId={me?.id || ''}
              size="md"
              allowChangeMood={true}
            />
            {/* MOOD BADGE ON AVATAR (Draft Post Mood) */}
            {draftMood && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-neutral-800 rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm ring-1 ring-black/5 animate-in zoom-in z-10">
                {currentMood?.emoji}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            {!isExpanded ? (
              <div
                onClick={() => setIsExpanded(true)}
                className="w-full h-10 rounded-full bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 px-4 flex items-center text-gray-400 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all"
              >
                Bạn đang nghĩ gì thế, {me?.name || 'người dùng'}?
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
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
                    onClick={() => setIsExpanded(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-full text-gray-400"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="relative group">
                  <Type className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    disabled={isLoading}
                    placeholder="Tiêu đề bài viết (tùy chọn)"
                    className="w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-10 pr-4 py-2.5 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:text-white transition-all disabled:opacity-60"
                  />
                </div>

                <div className={cn(
                  "relative rounded-2xl transition-all duration-500 overflow-hidden group",
                  draftBackgroundStyle || "bg-gray-50/50 border border-gray-100 dark:border-neutral-800 dark:bg-neutral-900"
                )}>
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    disabled={isLoading}
                    placeholder="Chia sẻ ý tưởng hoặc cập nhật mới nhất của bạn..."
                    className={cn(
                      "w-full min-h-[160px] resize-none px-4 py-4 text-[16px] outline-none transition-all disabled:opacity-60 leading-relaxed bg-transparent",
                      draftBackgroundStyle ? "text-center font-bold flex items-center justify-center placeholder:text-white/60" : "dark:text-gray-100"
                    )}
                  />

                  {/* BACKGROUND STYLE PICKER */}
                  <div className="absolute left-3 bottom-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    {BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.name}
                        onClick={() => setDraftBackgroundStyle(bg.class)}
                        className={cn(
                          "w-6 h-6 rounded-md border-2 transition-transform hover:scale-110",
                          bg.class || "bg-gray-200 dark:bg-neutral-700",
                          draftBackgroundStyle === bg.class ? "border-white scale-110 shadow-md" : "border-transparent"
                        )}
                        title={bg.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={draftLinkUrl}
                    onChange={(e) => setDraftLinkUrl(e.target.value)}
                    disabled={isLoading}
                    placeholder="Liên kết tham khảo (http://...)"
                    className="w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-10 pr-4 py-2.5 text-[11px] outline-none focus:border-blue-400 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300 transition-all disabled:opacity-60 italic"
                  />
                </div>
              </div>
            )}

            {draftImages.length > 0 && (
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
            )}
          </div>
        </div>

        {/* UTILITY BAR */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50 dark:border-neutral-900">
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              disabled={isLoading}
              onChange={(e) => handleFiles(e.target.files)}
            />

            <Tooltip title="Thêm ảnh">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-neutral-900 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
              >
                <ImagePlus size={18} />
              </button>
            </Tooltip>

            <Tooltip title="Chụp ảnh">
              <button
                onClick={() => setIsCameraOpen(true)}
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
                onClick={handleAiEnhance}
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

          <Button
            variant="primary"
            onClick={publishDraft}
            disabled={!canPost || isLoading || isAiProcessing}
            className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-blue-500/20 gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="hidden sm:inline">Đang đăng</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Đăng bài</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <CameraModal
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </Card>

  );
}
