import { autoRequest } from './auto.request';
import { normalizeNewsArticle } from '@smart/lib/news-media';
import type {
  NewsArticle,
  NewsArticleCategory,
  CreateNewsPayload,
  UpdateNewsPayload,
} from '@smart/types/ai-autopost';

function unwrapNewsList(res: any): NewsArticle[] {
  let arr: any[] = [];
  if (Array.isArray(res)) {
    arr = res;
  } else if (res && typeof res === 'object') {
    // Check success wrapper
    const data = res.success === true ? res.data : res;
    // Check items or data field in the unwrapped object
    if (Array.isArray(data)) {
      arr = data;
    } else if (data && typeof data === 'object') {
      const items = data.items || data.data;
      if (Array.isArray(items)) {
        arr = items;
      }
    }
  }
  return arr.map((item) => normalizeNewsArticle(item as NewsArticle));
}

function unwrapNews(res: any): NewsArticle {
  let raw = res;
  if (raw && typeof raw === 'object' && raw.success === true) {
    raw = raw.data;
  }
  return normalizeNewsArticle(raw as NewsArticle);
}

class NewsService {
  async getById(id: string): Promise<NewsArticle | null> {
    const res = await autoRequest<unknown>(`/home/news/${encodeURIComponent(id)}`, { method: 'GET' });
    let raw: unknown = res;
    if (raw && typeof raw === 'object' && 'data' in raw) {
      raw = (raw as { data: unknown }).data;
    }
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    if (o.success === false) return null;
    if (typeof o.id !== 'string') return null;
    return normalizeNewsArticle(raw as NewsArticle);
  }

  async listPublished(params: { page?: number; limit?: number; q?: string } = {}): Promise<{ data: NewsArticle[]; total: number; page: number; limit: number }> {
    const searchParams = new URLSearchParams();
    searchParams.append('category', 'NEWS');
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params.q) searchParams.append('q', params.q);

    const qs = searchParams.toString();
    const response = await autoRequest<{ success: boolean; data: any }>(`/home/news?${qs}`, { method: 'GET' });
    const res = response.data;

    if (Array.isArray(res)) {
      return {
        data: res.map((item) => normalizeNewsArticle(item as NewsArticle)),
        total: res.length,
        page: 0,
        limit: res.length,
      };
    }

    const items = res?.items || res?.data || (Array.isArray(res) ? res : []);
    return {
      data: (Array.isArray(items) ? items : []).map((item) => normalizeNewsArticle(item as NewsArticle)),
      total: res?.total || 0,
      page: res?.page || 0,
      limit: res?.limit || 10,
    };
  }

  async listTips(): Promise<NewsArticle[]> {
    const res = await autoRequest<unknown>('/home/news?category=TIP', { method: 'GET' });
    return unwrapNewsList(res);
  }

  async listAdmin(params: {
    category?: NewsArticleCategory;
    page?: number;
    limit?: number;
    q?: string;
  } = {}): Promise<{ data: NewsArticle[]; total: number; page: number; limit: number }> {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.append('category', params.category);
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params.q) searchParams.append('q', params.q);

    const qs = searchParams.toString();
    const q = qs ? `?${qs}` : '';
    const response = await autoRequest<{ success: boolean; data: any }>(`/home/admin/news${q}`, { method: 'GET' });
    const res = response.data;

    // Handle both old array format and new paginated object format
    if (Array.isArray(res)) {
      return {
        data: res.map((item) => normalizeNewsArticle(item as NewsArticle)),
        total: res.length,
        page: 0,
        limit: res.length,
      };
    }

    const items = res?.items || res?.data || (Array.isArray(res) ? res : []);
    return {
      data: (Array.isArray(items) ? items : []).map((item) => normalizeNewsArticle(item as NewsArticle)),
      total: res?.total || 0,
      page: res?.page || 0,
      limit: res?.limit || 10,
    };
  }

  async create(payload: CreateNewsPayload): Promise<NewsArticle> {
    const res = await autoRequest<unknown>('/home/admin/news', {
      method: 'POST',
      body: JSON.stringify({
        content: payload.content,
        category: payload.category ?? 'NEWS',
        linkUrl: payload.linkUrl?.trim() || undefined,
        media: (payload.media ?? []).map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          alt: m.alt ?? undefined,
        })),
      }),
    });
    return unwrapNews(res);
  }

  async update(payload: UpdateNewsPayload): Promise<NewsArticle> {
    const body: Record<string, unknown> = {
      content: payload.content,
      linkUrl: payload.linkUrl?.trim() ? payload.linkUrl.trim() : null,
      media: (payload.media ?? []).map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        alt: m.alt ?? undefined,
      })),
    };
    if (payload.category) body.category = payload.category;
    const res = await autoRequest<unknown>(`/home/admin/news/${encodeURIComponent(payload.id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return unwrapNews(res);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return autoRequest<{ success: boolean }>(`/home/admin/news/${encodeURIComponent(id)}/delete`, {
      method: 'POST',
    });
  }
}

export const newsService = new NewsService();
