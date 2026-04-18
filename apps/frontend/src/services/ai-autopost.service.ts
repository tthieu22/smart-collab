import { autoRequest } from './auto.request';
import type { AutoPostSettings, AutoPostRunResult } from '@smart/types/ai-autopost';

const BASE = '/home/admin/auto-post';

function unwrapSettings(payload: unknown): AutoPostSettings {
  const p = payload as { data?: AutoPostSettings } | AutoPostSettings | null | undefined;
  return (p && typeof p === 'object' && 'data' in p && p.data ? p.data : p) as AutoPostSettings;
}

/** Cài đặt & chạy job AI tạo tin — CRUD bài tin dùng `newsService`. */
class AiAutoPostService {
  async getSettings(): Promise<AutoPostSettings> {
    const res = await autoRequest<unknown>(`${BASE}/settings`, { method: 'GET' });
    return unwrapSettings(res);
  }

  async updateSettings(settings: Partial<AutoPostSettings>): Promise<AutoPostSettings> {
    const res = await autoRequest<unknown>(`${BASE}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
    return unwrapSettings(res);
  }

  async runNow(topic?: string): Promise<AutoPostRunResult> {
    const res = await autoRequest<unknown>(`${BASE}/run-now`, {
      method: 'POST',
      body: JSON.stringify({ topic }),
    });
    const body = (
      typeof res === 'object' && res !== null && 'data' in res ? (res as { data: unknown }).data : res
    ) as AutoPostRunResult | null | undefined;
    if (body && typeof body.success === 'boolean') {
      return body;
    }
    return { success: false, message: 'Phan hoi khong hop le tu server' };
  }
}

export const aiAutoPostService = new AiAutoPostService();
