'use client';

import { useMemo, useRef, useState } from 'react';
import { Card } from '@smart/components/ui/card';
import { Button } from '@smart/components/ui/button';
import { useFeedStore, type DraftImage } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';
import UserAvatar from '@smart/components/ui/UserAvatar';
import {
  Send,
  X,
  Link as LinkIcon,
  Type,
  Sparkles,
} from 'lucide-react';
import { cn } from '@smart/lib/utils';
import { message } from 'antd';
import { CameraModal } from '@smart/components/ui/CameraModal';
import { autoRequest } from '@smart/services/auto.request';

// Sub-components
import ComposerHeader, { MOODS } from './composer/ComposerHeader';
import ComposerToolbar from './composer/ComposerToolbar';
import ComposerImageGrid from './composer/ComposerImageGrid';
import ComposerBackgroundPicker from './composer/ComposerBackgroundPicker';
import { UI_CONFIG } from '@smart/lib';

export default function FeedComposer() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const {
    draftTitle,
    draftText,
    draftLinkUrl,
    draftImages,
    draftMood,
    draftBackgroundStyle,
    setDraftTitle,
    setDraftText,
    setDraftLinkUrl,
    addDraftImages,
    publishDraft,
    me,
    isLoading,
  } = useFeedStore(
    useShallow((s) => ({
      draftTitle: s.draftTitle,
      draftText: s.draftText,
      draftLinkUrl: s.draftLinkUrl,
      draftImages: s.draftImages,
      draftMood: s.draftMood,
      draftBackgroundStyle: s.draftBackgroundStyle,
      setDraftTitle: s.setDraftTitle,
      setDraftText: s.setDraftText,
      setDraftLinkUrl: s.setDraftLinkUrl,
      addDraftImages: s.addDraftImages,
      publishDraft: s.publishDraft,
      me: s.currentUserId ? s.users[s.currentUserId] : null,
      isLoading: s.isLoading,
    }))
  );

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

    try {
      const data = await autoRequest<{ success: boolean; content: string }>('/projects/ai-optimize-post', {
        method: 'POST',
        body: JSON.stringify({ content: draftText })
      });

      if (data.success && data.content) {
        setDraftText(data.content);
        message.success('Đã tối ưu nội dung bằng AI!');
      } else {
        message.error('Không thể tối ưu nội dung lúc này.');
      }
    } catch (err) {
      message.error('Lỗi kết nối với trợ lý AI.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const currentMood = MOODS.find(m => m.value === draftMood);

  const handlePublish = async () => {
    try {
      await publishDraft();
      setIsExpanded(false);
      message.success('Bài viết đã được đăng thành công!');
    } catch (err) {
      message.error('Lỗi khi đăng bài viết.');
    }
  };

  return (
    <Card
      padding="none"
      className={cn(
        "overflow-hidden transition-all duration-500",
        UI_CONFIG.CARD.BG,
        UI_CONFIG.CARD.BORDER,
        UI_CONFIG.CARD.RADIUS,
        isExpanded ? "shadow-2xl ring-2 ring-blue-500/20" : UI_CONFIG.CARD.SHADOW
      )}
    >
      <div className="p-3.5 sm:p-5 md:p-6">
        {!isExpanded ? (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group shrink-0 mt-0.5 sm:mt-1">
              <UserAvatar
                userId={me?.id || ''}
                size="sm"
                className="sm:scale-110"
                allowChangeMood={true}
              />
              {draftMood && (
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-neutral-800 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs shadow-md ring-2 ring-white dark:ring-neutral-900 animate-in zoom-in z-10">
                  {currentMood?.emoji}
                </div>
              )}
            </div>

            <div
              onClick={() => setIsExpanded(true)}
              className="flex-1 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-gray-50/50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800/50 px-4 sm:px-6 flex items-center text-gray-500 dark:text-gray-400 text-[13px] sm:text-[15px] cursor-pointer hover:bg-white dark:hover:bg-neutral-800 hover:border-blue-200 dark:hover:border-blue-900/30 transition-all shadow-inner group truncate"
            >
              <span className="truncate group-hover:text-blue-500 transition-colors">
                Bạn muốn chia sẻ điều gì, {me?.firstName || 'người dùng'}?
              </span>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
            {/* Expanded Header: Avatar + Visibility + Mood + Close */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <UserAvatar
                  userId={me?.id || ''}
                  size="sm"
                  allowChangeMood={false}
                />
              </div>
              <div className="flex-1">
                <ComposerHeader onCollapse={() => setIsExpanded(false)} />
              </div>
            </div>

            {/* Inputs: Now full width and aligned left */}
            <div className="space-y-4">
              <div className="relative group">
                <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  disabled={isLoading}
                  placeholder="Tiêu đề bài viết (tùy chọn)"
                  className="w-full rounded-xl sm:rounded-2xl border border-gray-100 bg-gray-50/30 pl-11 pr-5 py-2.5 sm:py-3 text-xs sm:text-sm font-black outline-none focus:border-blue-400 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:text-white transition-all disabled:opacity-60 placeholder:font-bold"
                />
              </div>

              <div className={cn(
                "relative rounded-[24px] sm:rounded-[32px] transition-all duration-700 overflow-hidden group/input shadow-sm border border-transparent",
                draftBackgroundStyle ? cn("shadow-xl ring-4 ring-black/5 dark:ring-white/5", draftBackgroundStyle) : "bg-gray-50/30 border-gray-100 dark:border-neutral-800 dark:bg-neutral-900 focus-within:bg-white dark:focus-within:bg-neutral-800"
              )}>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  disabled={isLoading}
                  placeholder="Nhập nội dung bài viết của bạn..."
                  className={cn(
                    "w-full min-h-[140px] sm:min-h-[200px] md:min-h-[280px] resize-none px-5 py-6 sm:px-8 sm:py-10 text-sm sm:text-base md:text-[19px] outline-none transition-all disabled:opacity-60 leading-relaxed bg-transparent custom-scrollbar",
                    draftBackgroundStyle ? "text-center font-black flex items-center justify-center placeholder:text-white/40 text-white text-lg sm:text-xl md:text-2xl" : "dark:text-gray-100"
                  )}
                />
              </div>

              {!draftImages.length && <ComposerBackgroundPicker />}

              <div className="relative group">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={draftLinkUrl}
                  onChange={(e) => setDraftLinkUrl(e.target.value)}
                  disabled={isLoading}
                  placeholder="Nguồn tham khảo (http://...)"
                  className="w-full rounded-xl sm:rounded-2xl border border-gray-100 bg-gray-50/30 pl-11 pr-5 py-2.5 text-[11px] sm:text-[12px] outline-none focus:border-blue-400 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300 transition-all disabled:opacity-60 italic font-medium"
                />
              </div>
            </div>

            <ComposerImageGrid />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-100/50 dark:border-neutral-900/50">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            disabled={isLoading}
            onChange={(e) => handleFiles(e.target.files)}
          />

          <ComposerToolbar
            onFileClick={() => fileInputRef.current?.click()}
            onCameraOpen={() => setIsCameraOpen(true)}
            isAiProcessing={isAiProcessing}
            onAiEnhance={handleAiEnhance}
          />

          {canPost && (
            <Button
              variant="primary"
              onClick={handlePublish}
              disabled={isLoading || isAiProcessing}
              className="rounded-xl sm:rounded-2xl h-10 sm:h-12 px-4 sm:px-8 font-black shadow-lg shadow-blue-500/20 gap-2 group transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-right-4 duration-500 shrink-0"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  <span className="hidden xs:inline text-xs sm:text-sm">Đăng bài ngay</span>
                  <span className="xs:hidden text-xs">Đăng</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <CameraModal
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => handleFiles([file] as any)}
      />
    </Card>
  );
}
