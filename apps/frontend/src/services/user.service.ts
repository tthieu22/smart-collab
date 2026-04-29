import {
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  ResendVerificationRequest,
  VerifyEmailRequest,
  CreateUserResponse,
  UpdateUserResponse,
  DeleteUserResponse,
  GetAllUsersResponse,
  GetMeResponse,
  ChangePasswordResponse,
  ResendVerificationResponse,
  VerifyEmailResponse,
  ToggleFollowResponse,
} from '../types/user';
import { ApiResponse } from '../types/auth';
import { autoRequest } from './auto.request';

export class UserService {
  private request<T>(endpoint: string, options: RequestInit = {}) {
    return autoRequest<T>(endpoint, options);
  }

  // Create user (admin only)
  createUser(request: CreateUserRequest) {
    return this.request<CreateUserResponse>('/user', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Get all users (admin only)
  getAllUsers() {
    return this.request<GetAllUsersResponse>('/user', {
      method: 'GET',
    });
  }

  // Get current user
  getMe() {
    return this.request<GetMeResponse>('/user/me', {
      method: 'GET',
    });
  }

  // Update current user
  updateMe(request: UpdateUserRequest) {
    return this.request<UpdateUserResponse>('/user/me', {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  // Update user by ID (admin only)
  updateUser(id: string, request: UpdateUserRequest) {
    return this.request<UpdateUserResponse>(`/user/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  // Delete user by ID (admin only)
  deleteUser(id: string) {
    return this.request<DeleteUserResponse>(`/user/${id}`, {
      method: 'DELETE',
    });
  }

  // Resend verification code
  resendVerificationCode(request: ResendVerificationRequest) {
    return this.request<ResendVerificationResponse>('/user/resend-verification', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Verify email
  verifyEmail(request: VerifyEmailRequest) {
    return this.request<VerifyEmailResponse>('/user/verify-email', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Change password
  changePassword(request: ChangePasswordRequest) {
    return this.request<ChangePasswordResponse>('/user/change-password', {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  // Get suggested collaborators
  getSuggestions(page: number = 1, limit: number = 5, type?: string) {
    const url = `/users/suggestions?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`;
    return this.request<ApiResponse<any>>(url, {
      method: 'GET',
    });
  }

  // Follow/Unfollow user
  toggleFollow(userId: string) {
    return this.request<{ success: boolean; message: string; data: { followed: boolean } }>(`/users/follow/${userId}`, {
      method: 'POST',
    });
  }

  // Get follow relation data
  getProfileRelation(userId: string) {
    return this.request<ApiResponse<any>>(`/users/profile/${userId}/relation`, {
      method: 'GET',
    });
  }
}

export const userService = new UserService();
