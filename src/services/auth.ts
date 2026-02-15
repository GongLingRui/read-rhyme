/**
 * Authentication API service
 */
import { apiClient, ApiResponse } from "./api";

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
    if (response.success && response.data?.access_token) {
      apiClient.setToken(response.data.access_token);
      // Store token in localStorage
      localStorage.setItem("auth_token", response.data.access_token);
      // Store user info
      localStorage.setItem("auth_user", JSON.stringify(response.data.user));
    }
    return response;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>("/auth/register", userData);
    if (response.success && response.data?.access_token) {
      apiClient.setToken(response.data.access_token);
      // Store token in localStorage
      localStorage.setItem("auth_token", response.data.access_token);
      // Store user info
      localStorage.setItem("auth_user", JSON.stringify(response.data.user));
    }
    return response;
  }

  /**
   * Logout user
   */
  logout(): void {
    apiClient.clearToken();
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  /**
   * Get stored user info
   */
  getUser(): User | null {
    const userStr = localStorage.getItem("auth_user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Initialize auth from stored token
   */
  initAuth(): boolean {
    const token = this.getToken();
    if (token) {
      apiClient.setToken(token);
      return true;
    }
    return false;
  }
}

export const authService = new AuthService();
