/**
 * Book Store with API integration
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { booksApi, type Book as ApiBook } from "@/services";

export interface Book {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  fileType: "txt" | "pdf" | "epub";
  totalPages?: number;
  totalChars?: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
  projects?: any[];
}

interface BookStore {
  books: Book[];
  currentBook: Book | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBooks: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }) => Promise<void>;
  fetchBook: (bookId: string) => Promise<void>;
  setCurrentBook: (book: Book | null) => void;
  addBook: (book: Book) => void;
  removeBook: (bookId: string) => void;
  updateBookProgress: (bookId: string, progress: number) => void;
  uploadBook: (file: File, metadata?: { title?: string; author?: string }) => Promise<Book>;
}

const mapApiBook = (apiBook: ApiBook): Book => ({
  id: apiBook.id,
  title: apiBook.title,
  author: apiBook.author,
  coverUrl: apiBook.cover_url,
  fileType: apiBook.file_type,
  totalPages: apiBook.total_pages,
  totalChars: apiBook.total_chars,
  progress: apiBook.progress,
  createdAt: apiBook.created_at,
  updatedAt: apiBook.updated_at,
  projects: apiBook.projects,
});

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      books: [],
      currentBook: null,
      isLoading: false,
      error: null,

      fetchBooks: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
          const response = await booksApi.list(params);
          if (response.success && response.data) {
            const books = response.data.items.map(mapApiBook);
            set({ books, isLoading: false });
          }
        } catch (error: any) {
          set({
            error: error.message || "获取书籍列表失败",
            isLoading: false,
          });
        }
      },

      fetchBook: async (bookId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await booksApi.get(bookId);
          if (response.success && response.data) {
            const book = mapApiBook(response.data);
            set({ currentBook: book, isLoading: false });
          }
        } catch (error: any) {
          set({
            error: error.message || "获取书籍详情失败",
            isLoading: false,
          });
        }
      },

      setCurrentBook: (book) => {
        set({ currentBook: book });
      },

      addBook: (book) => {
        set((state) => ({ books: [book, ...state.books] }));
      },

      removeBook: (bookId) => {
        set((state) => ({
          books: state.books.filter((b) => b.id !== bookId),
          currentBook:
            state.currentBook?.id === bookId ? null : state.currentBook,
        }));
      },

      updateBookProgress: (bookId, progress) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === bookId ? { ...b, progress } : b
          ),
          currentBook:
            state.currentBook?.id === bookId
              ? { ...state.currentBook, progress }
              : state.currentBook,
        }));
      },

      uploadBook: async (file, metadata) => {
        set({ isLoading: true, error: null });
        try {
          const response = await booksApi.upload(file, metadata);
          if (response.success && response.data) {
            const book = mapApiBook(response.data);
            set((state) => ({ books: [book, ...state.books], isLoading: false }));
            return book;
          }
          throw new Error("上传失败");
        } catch (error: any) {
          set({
            error: error.message || "上传书籍失败",
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: "book-storage",
      partialize: (state) => ({
        books: state.books,
        currentBook: state.currentBook?.id
          ? { id: state.currentBook.id }
          : null,
      }),
    }
  )
);
