import type { FeedMedia } from '@smart/types/feed';
import type { NewsArticle } from '@smart/types/ai-autopost';

export function normalizeNewsMedia(raw: unknown): FeedMedia[] {
  if (!Array.isArray(raw)) return [];
  const out: FeedMedia[] = [];
  raw.forEach((item, i) => {
    if (!item || typeof item !== 'object') return;
    const o = item as Record<string, unknown>;
    const url = String(o.url ?? '').trim();
    if (!url) return;
    const type = o.type === 'video' ? 'video' : 'image';
    const id = String(o.id ?? o.public_id ?? `media-${i}`);
    const alt = o.alt != null ? String(o.alt) : null;
    out.push({ id, type, url, alt });
  });
  return out;
}

export function normalizeNewsArticle(a: NewsArticle): NewsArticle {
  return {
    ...a,
    media: normalizeNewsMedia(a.media),
  };
}
