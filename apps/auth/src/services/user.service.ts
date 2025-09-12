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
} from '../types/user';
import { API_ENDPOINTS, APP_CONFIG } from '../lib/constants';

class UserService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    const url = `${APP_CONFIG.API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
      credentials: 'include',
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Create user (admin only)
  async createUser(
    request: CreateUserRequest,
    accessToken: string
  ): Promise<CreateUserResponse> {
    return this.request<CreateUserResponse>(
      API_ENDPOINTS.USER.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      accessToken
    );
  }

  // Get all users (admin only)
  async getAllUsers(accessToken: string): Promise<GetAllUsersResponse> {
    return this.request<GetAllUsersResponse>(
      API_ENDPOINTS.USER.FIND_ALL,
      {
        method: 'GET',
      },
      accessToken
    );
  }

  // Get current user
  async getMe(accessToken: string): Promise<GetMeResponse> {
    return this.request<GetMeResponse>(
      API_ENDPOINTS.USER.GET_ME,
      {
        method: 'GET',
      },
      accessToken
    );
  }

  // Update current user
  async updateMe(
    request: UpdateUserRequest,
    accessToken: string
  ): Promise<UpdateUserResponse> {
    return this.request<UpdateUserResponse>(
      API_ENDPOINTS.USER.UPDATE_ME,
      {
        method: 'PATCH',
        body: JSON.stringify(request),
      },
      accessToken
    );
  }

  // Update user by ID (admin only)
  async updateUser(
    id: string,
    request: UpdateUserRequest,
    accessToken: string
  ): Promise<UpdateUserResponse> {
    const endpoint = API_ENDPOINTS.USER.UPDATE.replace(':id', id);
    return this.request<UpdateUserResponse>(
      endpoint,
      {
        method: 'PATCH',
        body: JSON.stringify(request),
      },
      accessToken
    );
  }

  // Delete user by ID (admin only)
  async deleteUser(
    id: string,
    accessToken: string
  ): Promise<DeleteUserResponse> {
    const endpoint = API_ENDPOINTS.USER.DELETE.replace(':id', id);
    return this.request<DeleteUserResponse>(
      endpoint,
      {
        method: 'DELETE',
      },
      accessToken
    );
  }

  // Resend verification code
  async resendVerificationCode(
    request: ResendVerificationRequest
  ): Promise<ResendVerificationResponse> {
    return this.request<ResendVerificationResponse>(
      API_ENDPOINTS.USER.RESEND_VERIFICATION,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Verify email
  async verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return this.request<VerifyEmailResponse>(API_ENDPOINTS.USER.VERIFY_EMAIL, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Change password
  async changePassword(
    request: ChangePasswordRequest,
    accessToken: string
  ): Promise<ChangePasswordResponse> {
    return this.request<ChangePasswordResponse>(
      API_ENDPOINTS.USER.CHANGE_PASSWORD,
      {
        method: 'PATCH',
        body: JSON.stringify(request),
      },
      accessToken
    );
  }
}

export const userService = new UserService();
export type {
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
};
