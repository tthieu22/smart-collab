export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    user: User;
  };
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
  };
}

export interface MeResponse {
  success: boolean;
  message: string;
  data?: User;
}

export interface OAuthExchangeRequest {
  code: string;
}

export interface OAuthExchangeResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
  };
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface ValidateUserRequest {
  email: string;
  password: string;
}

export interface ValidateUserResponse {
  success: boolean;
  message: string;
  data?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
