import { create } from 'zustand';
import { newsService } from '@smart/services/news.service';
import type { NewsArticle } from '@smart/types/ai-autopost';

const STALE_TIME = 60 * 1000; // 1 minute

interface NewsState {
  articles: NewsArticle[];
  tipArticles: NewsArticle[];
  total: number;
  isInitialized: boolean;
  isTipsInitialized: boolean;
  lastFetchedAt: number;
  lastTipsFetchedAt: number;
  isLoading: boolean;
  error: string | null;

  fetchPublished: (params?: { page?: number; limit?: number; q?: string }) => Promise<void>;
  fetchTips: () => Promise<void>;
  setArticles: (articles: NewsArticle[]) => void;
}

export const useNewsStore = create<NewsState>((set, get) => ({
  articles: [],
  tipArticles: [],
  total: 0,
  isInitialized: false,
  isTipsInitialized: false,
  lastFetchedAt: 0,
  lastTipsFetchedAt: 0,
  isLoading: false,
  error: null,

  fetchPublished: async (params = {}) => {
    const { isInitialized, articles, lastFetchedAt } = get();
    const reqLimit = params.limit || 10;
    const now = Date.now();
    const isStale = now - lastFetchedAt > STALE_TIME;

    // 1. Data completely fresh? (For page 0/initial load)
    if (isInitialized && !isStale && !params.q && (params.page === 0 || !params.page) && articles.length >= reqLimit) {
        return;
    }

    // 2. Perform background fetch (SWR) if we have data but it's stale
    // Or if we don't have data, perform interactive fetch
    const isInitialLoad = !isInitialized || articles.length === 0;
    if (isInitialLoad) {
      set({ isLoading: true, error: null });
    }

    try {
      const res = await newsService.listPublished(params);
      console.log('[NewsStore] Fetched news:', res);
      set({
        articles: res.data,
        total: res.total,
        isInitialized: !params.q,
        lastFetchedAt: !params.q ? now : get().lastFetchedAt, // Only update timestamp if it's general feed
        isLoading: false
      });
    } catch (err: any) {
      console.error('[NewsStore] Fetch error:', err);
      set({ error: 'Không thể tải tin tức', isLoading: false });
    }
  },

  fetchTips: async () => {
    const { isTipsInitialized, lastTipsFetchedAt } = get();
    const now = Date.now();
    const isStale = now - lastTipsFetchedAt > STALE_TIME;

    if (isTipsInitialized && !isStale) return;

    if (!isTipsInitialized) {
      set({ isLoading: true });
    }

    try {
      const list = await newsService.listTips();
      set({
        tipArticles: list.slice(0, 3),
        isTipsInitialized: true,
        lastTipsFetchedAt: now,
        isLoading: false
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setArticles: (articles) => set({ articles })
}));
