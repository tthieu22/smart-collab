import { useAuthStore } from '../store/auth'; // đường dẫn của bạn
import { APP_CONFIG, API_ENDPOINTS } from '@smart/lib/constants';

export interface AutoRequestOptions extends RequestInit {
  params?: Record<string, any>;
}

export async function autoRequest<T>(
  endpoint: string,
  options: AutoRequestOptions = {}
): Promise<T> {
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

  const { accessToken, setAccessToken, clearAuth } = useAuthStore.getState();

  // Nếu body là FormData, không set Content-Type
  const isFormData = options.body instanceof FormData;

  const config: RequestInit = {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  let response = await fetch(url, config);

  // Nếu access token hết hạn
  if (response.status === 401) {
    try {
      const refreshRes = await fetch(`${APP_CONFIG.API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        credentials: 'include',
      });
      const refreshData = await refreshRes.json();

      if (refreshData.success && refreshData.data?.accessToken) {
        setAccessToken(refreshData.data.accessToken);

        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${refreshData.data.accessToken}`,
        };
        response = await fetch(url, config);
      } else {
        clearAuth();
        throw new Error('Refresh token failed');
      }
    } catch (err) {
      clearAuth();
      throw new Error('Unauthorized and refresh failed');
    }
  }

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json() as Promise<T>;
}
