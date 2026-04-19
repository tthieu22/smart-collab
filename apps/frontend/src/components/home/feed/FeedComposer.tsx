'use client';

import { useMemo, useRef } from 'react';
import { Card } from '@smart/components/ui/card';
import { Button } from '@smart/components/ui/button';
import { useFeedStore, type DraftImage } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';
import { Camera, ImagePlus, SendHorizonal, X } from 'lucide-react';

export default function FeedComposer() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const {
    draftText,
    draftImages,
    setDraftText,
    addDraftImages,
    removeDraftImage,
    publishDraft,
    me,
    isLoading,
  } = useFeedStore(
    useShallow((s) => ({
      draftText: s.draftText,
      draftImages: s.draftImages,
      setDraftText: s.setDraftText,
      addDraftImages: s.addDraftImages,
      removeDraftImage: s.removeDraftImage,
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
  };

  return (
    <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800 shrink-0">
          {me?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.avatarUrl} alt={me.name} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="flex-1">
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            disabled={isLoading}
            placeholder="Bạn đang nghĩ gì?"
            className="w-full min-h-24 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 disabled:opacity-60"
          />

          {draftImages.length ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {draftImages.map((img, idx) => (
                <div key={`${img.preview}-${idx}`} className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt={`draft-${idx}`} className="h-24 w-full object-cover" />
                  <button
                    onClick={() => removeDraftImage(idx)}
                    disabled={isLoading}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white disabled:opacity-50"
                    type="button"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            disabled={isLoading}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={isLoading}
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="gap-2"
              >
                <ImagePlus size={16} />
                Ảnh
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isLoading}
                className="gap-2"
              >
                <Camera size={16} />
                Chụp
              </Button>
            </div>

            <Button
              variant="primary"
              size="small"
              onClick={publishDraft}
              disabled={!canPost || isLoading}
              className="gap-2 min-w-[80px]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng...
                </>
              ) : (
                <>
                  <SendHorizonal size={16} />
                  Đăng
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
