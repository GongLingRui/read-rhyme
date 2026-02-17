/**
 * Rate Limit and Quota API Service
 */
import { apiClient, ApiResponse } from "./api";

export interface RateLimitStatus {
  user_id: string;
  rate_limit: {
    minute_remaining: number;
    hour_remaining: number;
    minute_limit: number;
    hour_limit: number;
  };
  quota: {
    tier: string;
    daily_used: number;
    daily_limit: number;
    daily_remaining: number;
    monthly_used: number;
    monthly_limit: number;
    monthly_remaining: number;
  };
}

export interface RateLimitStats {
  total_tracked_users: number;
  rate_limit_config: {
    requests_per_minute: number;
    requests_per_hour: number;
    burst_size: number;
  };
  quota_tiers: {
    [key: string]: {
      daily: number;
      monthly: number;
    };
  };
}

export interface QuotaTiers {
  tiers: {
    [key: string]: {
      daily: number;
      monthly: number;
    };
  };
  current_tier_counts: {
    [key: string]: number;
  };
}

export const rateLimitApi = {
  // Get current rate limit status for user
  getStatus: async (userId: string): Promise<ApiResponse<RateLimitStatus>> => {
    return apiClient.get(`/rate-limit/status?user_id=${userId}`);
  },

  // Get global rate limit statistics (admin)
  getStats: async (): Promise<ApiResponse<RateLimitStats>> => {
    return apiClient.get("/rate-limit/stats");
  },

  // Reset user rate limit (admin)
  resetUser: async (userId: string): Promise<ApiResponse<{ message: string; user_id: string }>> => {
    return apiClient.post(`/rate-limit/reset/${userId}`, {});
  },

  // Get available quota tiers
  getQuotaTiers: async (): Promise<ApiResponse<QuotaTiers>> => {
    return apiClient.get("/quota/tiers");
  },
};
