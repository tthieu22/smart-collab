import { User } from './auth';

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

// Response types
export interface CreateUserResponse {
  success: boolean;
  message: string;
  data?: User;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  data?: User;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  data?: null;
}

export interface GetAllUsersResponse {
  success: boolean;
  message: string;
  data?: User[];
}

export interface GetMeResponse {
  success: boolean;
  message: string;
  data?: User;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}
