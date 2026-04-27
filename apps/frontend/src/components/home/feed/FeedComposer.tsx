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

  return (
    <Card
      padding="none"
      className={cn(
        "dark:bg-neutral-950 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5 shadow-sm rounded-[24px] overflow-hidden transition-all duration-500",
        isExpanded ? "ring-2 ring-blue-500/20 shadow-xl" : ""
      )}
    >
      <div className="p-3 space-y-3">
        <div className="flex items-start gap-4">
          <div className="relative group">
            <UserAvatar
              userId={me?.id || ''}
              size="md"
              allowChangeMood={true}
            />
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
                <ComposerHeader onCollapse={() => setIsExpanded(false)} />

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
                  "relative rounded-2xl transition-all duration-500 overflow-hidden group/input",
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
                </div>

                {!draftImages.length && <ComposerBackgroundPicker />}

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

            <ComposerImageGrid />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50 dark:border-neutral-900">
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
        onCapture={(file) => handleFiles([file] as any)}
      />
    </Card>
  );
}
