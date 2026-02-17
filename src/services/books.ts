/**
 * Books API Service
 */
import { apiClient, ApiResponse, PaginatedResponse } from "./api";

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  cover_url?: string;
  file_type: "txt" | "pdf" | "epub";
  total_pages?: number;
  total_chars?: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface BookCreate {
  title?: string;
  author?: string;
  cover?: File;
}

export interface BookUpdate {
  title?: string;
  author?: string;
  cover_url?: string;
  progress?: number;
}

export interface BookListParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface BookContentResponse {
  content: string;
  chapters: Array<{
    index: number;
    title: string;
    offset: number;
  }>;
  metadata: {
    title: string;
    author: string;
    total_chars: number;
  };
}

export const booksApi = {
  // Get books list
  list: async (params: BookListParams = {}): Promise<ApiResponse<PaginatedResponse<Book>>> => {
    return apiClient.get("/books", params);
  },

  // Get book details
  get: async (bookId: string): Promise<ApiResponse<Book>> => {
    return apiClient.get(`/books/${bookId}`);
  },

  // Upload book
  upload: async (
    file: File,
    metadata?: Partial<BookCreate>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<Book>> => {
    const formData = new FormData();
    formData.append("file", file);

    if (metadata?.title) {
      formData.append("title", metadata.title);
    }
    if (metadata?.author) {
      formData.append("author", metadata.author);
    }
    if (metadata?.cover) {
      formData.append("cover", metadata.cover);
    }

    return apiClient.upload("/books/upload", formData, onProgress);
  },

  // Get book content
  getContent: async (
    bookId: string,
    format: "plain" | "markdown" | "html" = "plain",
    chapter?: number
  ): Promise<ApiResponse<BookContentResponse>> => {
    return apiClient.get(`/books/${bookId}/content`, { format, chapter });
  },

  // Update book
  update: async (bookId: string, data: BookUpdate): Promise<ApiResponse<Book>> => {
    return apiClient.patch(`/books/${bookId}`, data);
  },

  // Delete book
  delete: async (bookId: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    return apiClient.delete(`/books/${bookId}`);
  },
};
