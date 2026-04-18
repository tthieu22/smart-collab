'use client';

import { useEffect, useState } from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import LeftWidgets from '@smart/components/home/widgets/LeftWidgets';
import RightWidgets from '@smart/components/home/widgets/RightWidgets';
import { Loading } from '@smart/components/ui/loading';
import { Card } from '@smart/components/ui/card';
import { aiAutoPostService } from '@smart/services/ai-autopost.service';
import type { AutoPostSettings, NewsArticleCategory } from '@smart/types/ai-autopost';
import type { FeedMedia } from '@smart/types/feed';
import { useNewsAdminStore } from '@smart/store/news-admin';
import { uploadService } from '@smart/services/upload.service';
import { normalizeNewsMedia } from '@smart/lib/news-media';
import Link from 'next/link';

const defaultSettings: AutoPostSettings = {
  enabled: false,
  eventTriggerEnabled: true,
  contentTemplate: 'Tao bai viet tin tuc ngan gon ve du an: {{topic}}',
  postCountPerRun: 1,
  intervalMinutes: 60,
  locale: 'vi',
};

export default function AdminAiAutoPostPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<AutoPostSettings>(defaultSettings);
  const [draftContent, setDraftContent] = useState('');
  const [draftCategory, setDraftCategory] = useState<NewsArticleCategory>('NEWS');
  const [draftLinkUrl, setDraftLinkUrl] = useState('');
  const [draftMedia, setDraftMedia] = useState<FeedMedia[]>([]);
  const [uploadingNews, setUploadingNews] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingCategory, setEditingCategory] = useState<NewsArticleCategory>('NEWS');
  const [editingLinkUrl, setEditingLinkUrl] = useState('');
  const [editingMedia, setEditingMedia] = useState<FeedMedia[]>([]);
  const {
    articles,
    fetchNews,
    createNews: createNewsArticle,
    updateNews: updateNewsArticle,
    deleteNews: deleteNewsArticle,
    isLoading: newsLoading,
  } = useNewsAdminStore();

  useEffect(() => {
    aiAutoPostService
      .getSettings()
      .then((data) => setSettings({ ...defaultSettings, ...data }))
      .catch(() => setMessage('Khong the tai cai dat auto post'))
      .finally(() => setIsLoading(false));
    fetchNews();
  }, [fetchNews]);

  if (isLoading) {
    return <Loading fullScreen text="Dang tai cai dat..." />;
  }

  /** Chi luu cau hinh cron / trigger — khong goi AI. */
  const saveSettings = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const saved = await aiAutoPostService.updateSettings(settings);
      setSettings({ ...settings, ...saved });
      setMessage(
        'Da luu cai dat. Cron va su kien se dung cau hinh nay; bam "Chay ngay" de AI tao bai thu cong.',
      );
    } catch {
      setMessage('Luu cai dat that bai');
    } finally {
      setIsSaving(false);
    }
  };

  /** Goi dich vu AI (qua RabbitMQ) de sinh bai tin; khong bat buoc "Bat auto post". */
  const runNow = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const result = await aiAutoPostService.runNow('tin tuc admin');
      if (!result.success) {
        setMessage(
          result.message ||
            'AI khong tao duoc bai (kiem tra project service, LLM, hang doi ai_queue).',
        );
        return;
      }
      await fetchNews();
      setMessage(
        `Da tao ${result.postCount ?? 0} bai tin bang AI. Neu = 0, xem log backend.`,
      );
    } catch {
      setMessage('Khong the chay auto post ngay bay gio');
    } finally {
      setIsSaving(false);
    }
  };

  const appendUploadedMedia = (files: FileList | null, target: 'draft' | 'edit') => {
    if (!files?.length) return;
    setUploadingNews(true);
    uploadService
      .uploadFiles('news', Array.from(files))
      .then((res) => {
        if (!res.success || !Array.isArray(res.data)) throw new Error('upload failed');
        const add: FeedMedia[] = (res.data as { public_id?: string; url: string; resource_type?: string; original_filename?: string }[]).map(
          (r, i) => ({
            id: r.public_id || `img-${Date.now()}-${i}`,
            type: r.resource_type === 'video' ? 'video' : 'image',
            url: r.url,
            alt: r.original_filename || `Ảnh ${i + 1}`,
          }),
        );
        if (target === 'draft') setDraftMedia((m) => [...m, ...add]);
        else setEditingMedia((m) => [...m, ...add]);
      })
      .catch(() => setMessage('Tải ảnh lên thất bại'))
      .finally(() => setUploadingNews(false));
  };

  const createNews = async () => {
    if (!draftContent.trim()) return;
    setIsSaving(true);
    try {
      await createNewsArticle({
        content: draftContent.trim(),
        category: draftCategory,
        linkUrl: draftLinkUrl.trim() || undefined,
        media: draftMedia,
      });
      setDraftContent('');
      setDraftLinkUrl('');
      setDraftMedia([]);
      setMessage('Da tao bai viet tin tuc moi');
    } catch {
      setMessage('Khong the tao bai viet');
    } finally {
      setIsSaving(false);
    }
  };

  const saveEditNews = async () => {
    if (!editingId || !editingContent.trim()) return;
    setIsSaving(true);
    try {
      await updateNewsArticle({
        id: editingId,
        content: editingContent.trim(),
        category: editingCategory,
        linkUrl: editingLinkUrl.trim() || null,
        media: editingMedia,
      });
      setEditingId(null);
      setEditingContent('');
      setEditingLinkUrl('');
      setEditingMedia([]);
      setEditingCategory('NEWS');
      setMessage('Da cap nhat bai viet');
    } catch {
      setMessage('Cap nhat bai viet that bai');
    } finally {
      setIsSaving(false);
    }
  };

  const removeNews = async (id: string) => {
    setIsSaving(true);
    try {
      await deleteNewsArticle(id);
      setMessage('Da xoa bai viet');
    } catch {
      setMessage('Xoa bai viet that bai');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SiteLayout leftSidebar={<LeftWidgets />} rightSidebar={<RightWidgets />}>
      <div className="mx-auto w-full max-w-[680px] space-y-4">
        <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
          <h1 className="text-lg font-semibold">AI Auto Post</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            <strong>Lưu cài đặt</strong> chỉ ghi nhận cấu hình cho lịch cron và trigger sự kiện — không gọi
            LLM. <strong>Chạy ngay</strong> mới gửi yêu cầu tới dịch vụ AI để sinh bài tin (cần Project
            service và hàng đợi <code className="text-xs">ai_queue</code> hoạt động).
          </p>

          <div className="mt-4 grid gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
              />
              Bật auto post (cron định kỳ)
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.eventTriggerEnabled}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    eventTriggerEnabled: e.target.checked,
                  }))
                }
              />
              Bật trigger theo sự kiện AI project
            </label>

            <label className="text-sm">
              Số bài mỗi lần chạy
              <input
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                type="number"
                min={1}
                max={10}
                value={settings.postCountPerRun}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    postCountPerRun: Number(e.target.value || 1),
                  }))
                }
              />
            </label>

            <label className="text-sm">
              Chu kỳ (phút)
              <input
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                type="number"
                min={1}
                value={settings.intervalMinutes}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    intervalMinutes: Number(e.target.value || 1),
                  }))
                }
              />
            </label>

            <label className="text-sm">
              Mẫu / hướng dẫn cho AI (không phải bài đăng thành phẩm)
              <textarea
                className="mt-1 min-h-28 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                value={settings.contentTemplate}
                onChange={(e) => setSettings((s) => ({ ...s, contentTemplate: e.target.value }))}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveSettings}
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Lưu cài đặt
            </button>
            <button
              type="button"
              onClick={runNow}
              disabled={isSaving}
              className="rounded-md border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900"
            >
              Chạy ngay (AI)
            </button>
          </div>
        </Card>

        <Card padding="small" className="dark:bg-neutral-950 dark:border-neutral-800">
          <h2 className="text-base font-semibold">Quản lý tin thủ công</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Danh mục <strong>NEWS</strong> hiển thị trang Tin tức; <strong>TIP</strong> là mẹo/hướng dẫn (sidebar
            &quot;Mẹo &amp; hướng dẫn&quot;). Có thể chèn URL trực tiếp trong nội dung; liên kết ngoài tùy chọn; ảnh
            qua Cloudinary (thư mục <code className="text-xs">projects/news</code>). AI auto post luôn tạo NEWS.
          </p>

          <div className="mt-3 space-y-3">
            <textarea
              className="min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              placeholder="Nội dung — có thể dán https://... trong bài"
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
            />
            <label className="block text-sm text-gray-600 dark:text-gray-400">
              Liên kết ngoài (tùy chọn)
              <input
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                placeholder="https://..."
                value={draftLinkUrl}
                onChange={(e) => setDraftLinkUrl(e.target.value)}
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="text-xs text-gray-500 dark:text-gray-400 sm:min-w-[160px]">
                Danh mục
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value as NewsArticleCategory)}
                >
                  <option value="NEWS">Tin tức (NEWS)</option>
                  <option value="TIP">Mẹo &amp; hướng dẫn (TIP)</option>
                </select>
              </label>
              <label className="flex-1 text-xs text-gray-500 dark:text-gray-400">
                Ảnh đính kèm (tùy chọn)
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  disabled={uploadingNews}
                  className="mt-1 block w-full text-sm"
                  onChange={(e) => appendUploadedMedia(e.target.files, 'draft')}
                />
              </label>
              <button
                type="button"
                onClick={createNews}
                disabled={isSaving || uploadingNews}
                className="h-fit shrink-0 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Thêm bài
              </button>
            </div>
            {draftMedia.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {draftMedia.map((m) => (
                  <div key={m.id} className="relative h-20 w-20 overflow-hidden rounded-lg border dark:border-neutral-700">
                    {m.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <video src={m.url} className="h-full w-full object-cover" muted />
                    )}
                    <button
                      type="button"
                      className="absolute right-0 top-0 rounded-bl bg-red-600 px-1 text-xs text-white"
                      onClick={() => setDraftMedia((x) => x.filter((i) => i.id !== m.id))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            {newsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải...</p>
            ) : articles.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có bài</p>
            ) : (
              articles.map((article) => (
                <div
                  key={article.id}
                  className="rounded-md border border-gray-200 p-3 dark:border-neutral-800"
                >
                  <div className="mb-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        article.category === 'TIP'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {article.category === 'TIP' ? 'TIP · Mẹo' : 'NEWS · Tin'}
                    </span>
                  </div>
                  {editingId === article.id ? (
                    <>
                      <label className="mb-2 block text-xs text-gray-500 dark:text-gray-400">
                        Danh mục
                        <select
                          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                          value={editingCategory}
                          onChange={(e) => setEditingCategory(e.target.value as NewsArticleCategory)}
                        >
                          <option value="NEWS">Tin tức (NEWS)</option>
                          <option value="TIP">Mẹo &amp; hướng dẫn (TIP)</option>
                        </select>
                      </label>
                      <label className="mb-2 block text-xs text-gray-500 dark:text-gray-400">
                        Liên kết ngoài
                        <input
                          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                          value={editingLinkUrl}
                          onChange={(e) => setEditingLinkUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </label>
                      <textarea
                        className="min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                      />
                      <label className="mt-2 block text-xs text-gray-500 dark:text-gray-400">
                        Thêm ảnh
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          disabled={uploadingNews}
                          className="mt-1 block w-full text-sm"
                          onChange={(e) => appendUploadedMedia(e.target.files, 'edit')}
                        />
                      </label>
                      {editingMedia.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {editingMedia.map((m) => (
                            <div
                              key={m.id}
                              className="relative h-20 w-20 overflow-hidden rounded-lg border dark:border-neutral-700"
                            >
                              {m.type === 'image' ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <video src={m.url} className="h-full w-full object-cover" muted />
                              )}
                              <button
                                type="button"
                                className="absolute right-0 top-0 rounded-bl bg-red-600 px-1 text-xs text-white"
                                onClick={() => setEditingMedia((x) => x.filter((i) => i.id !== m.id))}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {article.linkUrl ? (
                        <p className="mb-2 text-xs text-blue-600 dark:text-blue-400">
                          Link: {article.linkUrl}
                        </p>
                      ) : null}
                      {(article.media?.length ?? 0) > 0 ? (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {normalizeNewsMedia(article.media).map((m) => (
                            <div key={m.id} className="h-14 w-14 overflow-hidden rounded border dark:border-neutral-700">
                              {m.type === 'image' ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.url} alt="" className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <p className="text-sm">{article.content}</p>
                      <p className="mt-2">
                        <Link
                          href={`/news/${article.id}`}
                          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Xem trang chi tiết →
                        </Link>
                      </p>
                    </>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {editingId === article.id ? (
                      <>
                        <button
                          type="button"
                          onClick={saveEditNews}
                          className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingContent('');
                            setEditingCategory('NEWS');
                            setEditingLinkUrl('');
                            setEditingMedia([]);
                          }}
                          className="rounded-md border border-gray-300 px-3 py-1 text-xs dark:border-neutral-700"
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(article.id);
                            setEditingContent(article.content);
                            setEditingCategory(
                              article.category === 'TIP' ? 'TIP' : 'NEWS',
                            );
                            setEditingLinkUrl(article.linkUrl?.trim() ?? '');
                            setEditingMedia(normalizeNewsMedia(article.media));
                          }}
                          className="rounded-md border border-gray-300 px-3 py-1 text-xs dark:border-neutral-700"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNews(article.id)}
                          className="rounded-md bg-red-600 px-3 py-1 text-xs text-white"
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {message ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        ) : null}
      </div>
    </SiteLayout>
  );
}
