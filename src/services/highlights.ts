/**
 * Highlights and Notes API Service
 */
import { apiClient, ApiResponse } from "./api";

export interface Highlight {
  id: string;
  user_id: string;
  book_id: string;
  chunk_id?: string;
  text: string;
  color: "yellow" | "green" | "blue" | "pink";
  start_offset: number;
  end_offset: number;
  chapter?: string;
  note?: Note;
  created_at: string;
}

export interface HighlightCreate {
  text: string;
  color: "yellow" | "green" | "blue" | "pink";
  start_offset: number;
  end_offset: number;
  chapter?: string;
  chunk_id?: string;
  note?: string;
}

export interface Note {
  id: string;
  highlight_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const highlightsApi = {
  // Get highlights for a book
  list: async (
    bookId: string,
    params: {
      color?: string;
      chapter?: string;
    } = {}
  ): Promise<ApiResponse<Highlight[]>> => {
    return apiClient.get(`/books/${bookId}`, params);
  },

  // Create highlight
  create: async (bookId: string, data: HighlightCreate): Promise<ApiResponse<Highlight>> => {
    return apiClient.post(`/books/${bookId}`, data);
  },

  // Update highlight
  update: async (
    highlightId: string,
    data: { color?: "yellow" | "green" | "blue" | "pink" }
  ): Promise<ApiResponse<Highlight>> => {
    return apiClient.patch(`/highlights/${highlightId}`, data);
  },

  // Delete highlight
  delete: async (highlightId: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    return apiClient.delete(`/highlights/${highlightId}`);
  },

  // Set note for highlight
  setNote: async (highlightId: string, content: string): Promise<ApiResponse<Note>> => {
    return apiClient.put(`/highlights/${highlightId}/note`, { content });
  },

  // Delete note
  deleteNote: async (highlightId: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    return apiClient.delete(`/highlights/${highlightId}/note`);
  },

  // Export notes
  exportNotes: async (bookId: string, format: "json" | "markdown" | "csv" = "markdown"): Promise<void> => {
    return apiClient.download(`/books/${bookId}/notes/export?format=${format}`);
  },
};
