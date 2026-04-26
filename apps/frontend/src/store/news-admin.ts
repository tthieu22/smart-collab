import { create } from 'zustand';
import { newsService } from '@smart/services/news.service';
import type { NewsArticle, CreateNewsPayload, UpdateNewsPayload, NewsArticleCategory } from '@smart/types/ai-autopost';

interface NewsAdminState {
  articles: NewsArticle[];
  total: number;
  page: number;
  limit: number;
  q: string;
  category?: NewsArticleCategory;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  fetchNews: (params?: {
    page?: number;
    limit?: number;
    q?: string;
    category?: NewsArticleCategory;
    force?: boolean;
  }) => Promise<void>;
  createNews: (payload: CreateNewsPayload) => Promise<void>;
  updateNews: (payload: UpdateNewsPayload) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
}

export const useNewsAdminStore = create<NewsAdminState>((set, get) => ({
  articles: [],
  total: 0,
  page: 0,
  limit: 10,
  q: '',
  category: undefined,
  isLoading: false,
  isInitialized: false,
  error: null,
  fetchNews: async (params = {}) => {
    const state = get();
    const newParams = {
      page: params.page !== undefined ? params.page : state.page,
      limit: params.limit !== undefined ? params.limit : state.limit,
      q: params.q !== undefined ? params.q : state.q,
      category: params.category !== undefined ? params.category : state.category,
    };

    // Optimization: Skip if already initialized and no specific changes requested
    if (state.isInitialized && !params.force && params.page === undefined && params.q === undefined && params.category === undefined) {
      return;
    }

    set({ isLoading: true, error: null, ...newParams });
    try {
      const res = await newsService.listAdmin(newParams);
      set({
        articles: res.data,
        total: res.total,
        page: res.page,
        limit: res.limit,
        isInitialized: true,
      });
    } catch {
      set({ error: 'Khong the tai danh sach tin tuc' });
    } finally {
      set({ isLoading: false });
    }
  },
  createNews: async (payload: CreateNewsPayload) => {
    await newsService.create(payload);
    const { page, limit, q, category } = get();
    await get().fetchNews({ page, limit, q, category });
  },
  updateNews: async (payload: UpdateNewsPayload) => {
    await newsService.update(payload);
    const { page, limit, q, category } = get();
    await get().fetchNews({ page, limit, q, category });
  },
  deleteNews: async (id: string) => {
    await newsService.remove(id);
    const { page, limit, q, category } = get();
    await get().fetchNews({ page, limit, q, category });
  },
}));
