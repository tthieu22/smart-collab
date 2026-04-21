export interface AutoPostSettings {
  enabled: boolean;
  eventTriggerEnabled: boolean;
  contentTemplate: string;
  postCountPerRun: number;
  intervalMinutes: number;
  locale: string;
  lastRunAt?: string;
}

import type { FeedMedia } from './feed';

/** Danh mục bài trong NewsArticle: tin thường vs mẹo/hướng dẫn (sidebar). */
export type NewsArticleCategory = 'NEWS' | 'TIP';

/** Bản ghi tin tức (collection NewsArticle), không dùng cho Post / home feed. */
export interface NewsArticle {
  id: string;
  authorId: string;
  title?: string;
  category?: NewsArticleCategory;
  content: string;
  /** Liên kết ngoài (nút “Đọc thêm”). */
  linkUrl?: string | null;
  media?: FeedMedia[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNewsPayload {
  content: string;
  category?: NewsArticleCategory;
  linkUrl?: string;
  media?: FeedMedia[];
}

export interface UpdateNewsPayload {
  id: string;
  content: string;
  category?: NewsArticleCategory;
  linkUrl?: string | null;
  media?: FeedMedia[];
}

export interface AutoPostSettingsResponse {
  success?: boolean;
  message?: string;
  data?: AutoPostSettings;
}

export interface AutoPostRunResult {
  success: boolean;
  message?: string;
  postCount?: number;
  source?: string;
  eventKey?: string;
}
