const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Hàm gọi refresh token
  private async refreshToken(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.data && data.data.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
        return data.data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);
      if (response.status === 401 && !isRetry) {
        const newToken = await this.refreshToken();
        if (newToken) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${newToken}`,
          };
          const retryResponse = await fetch(url, config);
          const retryData = await retryResponse.json();
          if (!retryResponse.ok) {
            throw new Error(retryData.message || "API request failed");
          }
          return retryData;
        } else {
          localStorage.removeItem("accessToken");
          window.location.href = "/auth/login";
          throw new Error("Session expired. Please login again.");
        }
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  async login(credentials: { email: string; password: string }) {
    return this.request<{ accessToken: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    return this.request<{ email: string }>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<any>("/auth/me");
  }

  async verifyEmail(data: { email: string; code: string }) {
    return this.request("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async resendVerificationCode(email: string) {
    return this.request("/users/resend-verification-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
