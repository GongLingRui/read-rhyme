/**
 * Thoughts API Service
 */
import { apiClient, ApiResponse } from "./api";

export interface Thought {
  id: string;
  user_id: string;
  book_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  book_title?: string;
  book_author?: string;
  book_cover_url?: string;
}

export interface ThoughtCreate {
  book_id: string;
  content: string;
}

export interface ThoughtUpdate {
  content: string;
}

export interface ThoughtListParams {
  book_id?: string;
  page?: number;
  page_size?: number;
}

export const thoughtsApi = {
  // Get thoughts list
  list: async (params: ThoughtListParams = {}): Promise<ApiResponse<Thought[]>> => {
    return apiClient.get("/thoughts", params);
  },

  // Get a specific thought
  get: async (thoughtId: string): Promise<ApiResponse<Thought>> => {
    return apiClient.get(`/thoughts/${thoughtId}`);
  },

  // Get all thoughts for a book
  getBookThoughts: async (bookId: string): Promise<ApiResponse<Thought[]>> => {
    return apiClient.get(`/thoughts/book/${bookId}/all`);
  },

  // Create thought
  create: async (data: ThoughtCreate): Promise<ApiResponse<Thought>> => {
    return apiClient.post("/thoughts", data);
  },

  // Update thought
  update: async (thoughtId: string, data: ThoughtUpdate): Promise<ApiResponse<Thought>> => {
    return apiClient.patch(`/thoughts/${thoughtId}`, data);
  },

  // Delete thought
  delete: async (thoughtId: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    return apiClient.delete(`/thoughts/${thoughtId}`);
  },
};
