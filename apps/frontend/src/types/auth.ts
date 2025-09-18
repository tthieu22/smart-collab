export interface User {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  googleId?: string | null;
  emailVerificationCode?: string | null;
  emailVerificationCodeExpires?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    // Khi login thành công
    accessToken?: string;
    user?: User;

    // Khi email chưa được xác thực
    needsVerified?: boolean;

    // Khi tài khoản Google hoặc chưa có mật khẩu
    needsPassword?: boolean;
    userPendingPassword?: User;

    // Nếu có thêm các trường khác từ backend thì thêm vào đây
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterResponse extends ApiResponse {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface ApiError {
  success: false; // luôn false cho lỗi
  message: string; // thông báo lỗi
  code?: number; // tùy chọn, có thể là HTTP status code
  details?: unknown; // tùy chọn, dữ liệu lỗi chi tiết
}
