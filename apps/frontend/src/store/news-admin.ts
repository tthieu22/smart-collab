import { create } from 'zustand';
import { newsService } from '@smart/services/news.service';
import type { NewsArticle, CreateNewsPayload, UpdateNewsPayload } from '@smart/types/ai-autopost';

interface NewsAdminState {
  articles: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  fetchNews: () => Promise<void>;
  createNews: (payload: CreateNewsPayload) => Promise<void>;
  updateNews: (payload: UpdateNewsPayload) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
}

export const useNewsAdminStore = create<NewsAdminState>((set, get) => ({
  articles: [],
  isLoading: false,
  error: null,
  fetchNews: async () => {
    set({ isLoading: true, error: null });
    try {
      const articles = await newsService.listAdmin();
      set({ articles });
    } catch {
      set({ error: 'Khong the tai danh sach tin tuc' });
    } finally {
      set({ isLoading: false });
    }
  },
  createNews: async (payload: CreateNewsPayload) => {
    await newsService.create(payload);
    await get().fetchNews();
  },
  updateNews: async (payload: UpdateNewsPayload) => {
    await newsService.update(payload);
    await get().fetchNews();
  },
  deleteNews: async (id: string) => {
    await newsService.remove(id);
    await get().fetchNews();
  },
}));
