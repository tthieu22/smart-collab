import { useAuthStore } from '../store/auth'; // đường dẫn của bạn
import { APP_CONFIG, API_ENDPOINTS } from '@smart/lib/constants';

export interface AutoRequestOptions extends RequestInit {
  params?: Record<string, any>;
}

const inFlightRequests = new Map<string, Promise<any>>();

export async function autoRequest<T>(
  endpoint: string,
  options: AutoRequestOptions = {}
): Promise<T> {
  const method = options.method?.toUpperCase() || 'GET';
  let url = `${APP_CONFIG.API_BASE_URL}${endpoint}`;
  
  // Append query params if present
  if (options.params) {
    const query = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // Deduplicate GET requests
  if (method === 'GET') {
    const existing = inFlightRequests.get(url);
    if (existing) return existing;
  }

  const fetchPromise = (async () => {
    try {
      const { accessToken, setAccessToken, clearAuth } = useAuthStore.getState();
      const isFormData = options.body instanceof FormData || (options.body && typeof options.body === 'object' && options.body.constructor && options.body.constructor.name === 'FormData');

      const config: RequestInit = {
        ...options,
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...options.headers,
        },
        credentials: 'include',
      };

      let response = await fetch(url, config);

      if (response.status === 401) {
        const refreshRes = await fetch(`${APP_CONFIG.API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
          method: 'POST',
          credentials: 'include',
        });
        const refreshData = await refreshRes.json();

        if (refreshData.success && refreshData.data?.accessToken) {
          setAccessToken(refreshData.data.accessToken);
          config.headers = { ...config.headers, Authorization: `Bearer ${refreshData.data.accessToken}` };
          response = await fetch(url, config);
        } else {
          clearAuth();
          throw new Error('Refresh token failed');
        }
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } finally {
      if (method === 'GET') inFlightRequests.delete(url);
    }
  })();

  if (method === 'GET') inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}
