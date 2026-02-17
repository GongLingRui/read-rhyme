/**
 * API Client for backend communication
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 60000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - always read token from localStorage
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Read token directly from localStorage to ensure we always have the latest value
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // CRITICAL: Remove Content-Type header for FormData uploads
        // This allows axios to automatically set the correct multipart/form-data with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }

        // Debug: log request details
        console.log('[API Request]', config.method?.toUpperCase(), config.url);
        console.log('[API] Headers:', config.headers);
        console.log('[API] Data type:', config.data?.constructor.name);
        if (config.data instanceof FormData) {
          console.log('[API] FormData entries:', Array.from(config.data.entries()).map(e => {
            if (e[1] instanceof File) return [e[0], `File(${e[1].name})`];
            return e;
          }));
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError<any>) => {
        if (error.response?.status === 401) {
          // Clear token from localStorage on 401
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          // You could redirect to login here
          console.error("Unauthorized - please login again");
        }
        // Create a more informative error object
        const enhancedError: any = new Error(
          error.response?.data?.detail || error.response?.data?.message || error.message
        );
        enhancedError.response = error.response;
        enhancedError.status = error.response?.status;
        enhancedError.data = error.response?.data;
        return Promise.reject(enhancedError);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async get<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.client.post(url, data);
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.client.put(url, data);
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.client.patch(url, data);
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.client.delete(url);
  }

  async upload<T = any>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    // Debug: log FormData contents
    console.log("Upload FormData contents:");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    return this.client.post(url, formData, {
      // Don't set headers at all - let the interceptor handle Authorization
      // This prevents overriding the Authorization header from the interceptor
      timeout: 300000, // 5 minutes for file uploads
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  }

  async download(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename || "download";
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

// Get API base URL from environment
const getBaseUrl = () => {
  // In development, use relative path to go through Vite proxy
  // In production, use full URL from environment variable
  if (import.meta.env.DEV) {
    return "/api"; // Will be proxied by Vite to http://localhost:8000/api
  }
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
};

// Create global API client instance
export const apiClient = new ApiClient({
  baseURL: getBaseUrl(),
  timeout: 60000,
});
