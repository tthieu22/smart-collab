import {
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
  MeResponse,
  OAuthExchangeResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ValidateUserRequest,
  ValidateUserResponse,
  ApiResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth';
import { API_ENDPOINTS } from '../lib/constants';
import { autoRequest } from './auto.request';

class AuthService {
  login(credentials: LoginCredentials): Promise<LoginResponse> {
    return autoRequest<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  register(request: RegisterRequest): Promise<RegisterResponse> {
    return autoRequest<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  refresh(): Promise<RefreshResponse> {
    return autoRequest<RefreshResponse>(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
    });
  }

  logout(): Promise<ApiResponse> {
    return autoRequest<ApiResponse>(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
  }

  me(): Promise<MeResponse> {
    return autoRequest<MeResponse>(API_ENDPOINTS.AUTH.ME, {
      method: 'GET',
    });
  }

  oauthExchange(code: string): Promise<OAuthExchangeResponse> {
    return autoRequest<OAuthExchangeResponse>(API_ENDPOINTS.AUTH.OAUTH_EXCHANGE, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return autoRequest<VerifyEmailResponse>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  validateUser(request: ValidateUserRequest): Promise<ValidateUserResponse> {
    return autoRequest<ValidateUserResponse>(API_ENDPOINTS.AUTH.VALIDATE_USER, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  forgotPassword(email: string): Promise<ApiResponse> {
    return autoRequest<ApiResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  resetPassword(request: any): Promise<ApiResponse> {
    return autoRequest<ApiResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  resendCode(email: string): Promise<ApiResponse> {
    return autoRequest<ApiResponse>(API_ENDPOINTS.AUTH.RESEND_CODE, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
}

export const authService = new AuthService();
