export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutAllRequest {
  userId: string;
}

export interface GetUserRequest {
  userId: string;
}

export interface ValidateUserRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface GoogleAuthRequest {
  id: string;
  email: string;
  givenName?: string;
  familyName?: string;
  avatar?: string;
}

export interface OAuthExchangeRequest {
  code: string;
}
