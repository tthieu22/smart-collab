'use client';

import { useMemo, useRef, useState } from 'react';
import { Card } from '@smart/components/ui/card';
import { Button } from '@smart/components/ui/button';
import { useFeedStore, type DraftImage } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';
import UserAvatar from '@smart/components/ui/UserAvatar';
import {
  Rocket,
  X,
  Link as LinkIcon,
  Type,
  Sparkles,
  Zap
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
      message.success('Tín hiệu đã được phóng thành công!');
    } catch (err) {
      message.error('Lỗi khi phóng tín hiệu.');
    }
  };

  return (
    <Card
      padding="none"
      className={cn(
        "dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5 shadow-sm rounded-[24px] overflow-hidden transition-all duration-500",
        isExpanded ? "ring-2 ring-blue-500/20 shadow-2xl" : "hover:shadow-md"
      )}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-4">
          <div className="relative group shrink-0">
            <UserAvatar
              userId={me?.id || ''}
              size="md"
              allowChangeMood={true}
            />
            {draftMood && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-neutral-800 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md ring-2 ring-white dark:ring-neutral-900 animate-in zoom-in z-10">
                {currentMood?.emoji}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {!isExpanded ? (
              <div
                onClick={() => setIsExpanded(true)}
                className="w-full h-11 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 px-5 flex items-center text-gray-500 dark:text-gray-400 text-[15px] cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all shadow-inner"
              >
                Bạn muốn truyền tín hiệu gì đến phi hành đoàn, {me?.name || 'phi hành gia'}?
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                <ComposerHeader onCollapse={() => setIsExpanded(false)} />

                <div className="relative group">
                  <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    disabled={isLoading}
                    placeholder="Mã định danh tín hiệu (Tiêu đề bài viết - tùy chọn)"
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 pl-11 pr-5 py-3 text-sm font-black outline-none focus:border-blue-400 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:text-white transition-all disabled:opacity-60 placeholder:font-bold"
                  />
                </div>

                <div className={cn(
                  "relative rounded-[28px] transition-all duration-700 overflow-hidden group/input shadow-sm border border-transparent",
                  draftBackgroundStyle ? cn("shadow-xl ring-4 ring-black/5 dark:ring-white/5", draftBackgroundStyle) : "bg-gray-50/50 border-gray-100 dark:border-neutral-800 dark:bg-neutral-900 focus-within:bg-white dark:focus-within:bg-neutral-800"
                )}>
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    disabled={isLoading}
                    placeholder="Nhập nội dung tín hiệu của bạn..."
                    className={cn(
                      "w-full min-h-[240px] resize-none px-10 py-10 text-[18px] outline-none transition-all disabled:opacity-60 leading-relaxed bg-transparent custom-scrollbar",
                      draftBackgroundStyle ? "text-center font-black flex items-center justify-center placeholder:text-white/40 text-white text-2xl" : "dark:text-gray-100"
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
                    placeholder="Nguồn tín hiệu gốc (http://...)"
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 pl-11 pr-5 py-2.5 text-[12px] outline-none focus:border-blue-400 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300 transition-all disabled:opacity-60 italic font-medium"
                  />
                </div>
              </div>
            )}

            <ComposerImageGrid />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50 dark:border-neutral-900">
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
              className="rounded-2xl h-12 px-8 font-black shadow-xl shadow-blue-500/20 gap-3 group transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-right-4 duration-500"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Đang phóng...</span>
                </>
              ) : (
                <>
                  <Rocket size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  <span>Phóng tín hiệu</span>
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
