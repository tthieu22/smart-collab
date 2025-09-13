import {
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
  MeResponse,
  OAuthExchangeRequest,
  OAuthExchangeResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ValidateUserRequest,
  ValidateUserResponse,
  ApiResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth';
import { API_ENDPOINTS, APP_CONFIG } from '../lib/constants';

class AuthService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${APP_CONFIG.API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.request<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async refresh(): Promise<RefreshResponse> {
    return this.request<RefreshResponse>(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
  }

  async logoutAll(accessToken: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.AUTH.LOGOUT_ALL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async me(accessToken: string): Promise<MeResponse> {
    return this.request<MeResponse>(API_ENDPOINTS.AUTH.ME, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async oauthExchange(code: string): Promise<OAuthExchangeResponse> {
    return this.request<OAuthExchangeResponse>(
      API_ENDPOINTS.AUTH.OAUTH_EXCHANGE,
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      }
    );
  }

  async verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return this.request<VerifyEmailResponse>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async validateUser(
    request: ValidateUserRequest
  ): Promise<ValidateUserResponse> {
    return this.request<ValidateUserResponse>(
      API_ENDPOINTS.AUTH.VALIDATE_USER,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Helper method to check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payloadPart = parts[1];
      if (!payloadPart) return true;

      const payload = JSON.parse(atob(payloadPart));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

export const authService = new AuthService();
export type {
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
  MeResponse,
  OAuthExchangeRequest,
  OAuthExchangeResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ValidateUserRequest,
  ValidateUserResponse,
};
