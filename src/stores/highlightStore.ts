/**
 * Highlight Store with API integration
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { highlightsApi, type Highlight as ApiHighlight } from "@/services";

export interface Highlight {
  id: string;
  userId: string;
  bookId: string;
  chunkId: string | null;
  text: string;
  color: "yellow" | "green" | "blue" | "pink";
  startOffset: number;
  endOffset: number;
  chapter: string | null;
  note?: {
    id: string;
    highlightId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  createdAt: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCoverUrl?: string;
}

/** 用于阅读页内联展示的划线（与 Highlight 同构） */
export type SavedHighlight = Highlight;
/** 划线颜色 */
export type HighlightColor = Highlight["color"];

interface HighlightStore {
  highlights: Highlight[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBookHighlights: (bookId: string) => Promise<void>;
  fetchAllHighlights: () => Promise<void>;
  addHighlight: (bookId: string, data: {
    text: string;
    color: "yellow" | "green" | "blue" | "pink";
    start_offset: number;
    end_offset: number;
    chapter?: string;
    chunk_id?: string;
    note?: string;
  }) => Promise<void>;
  deleteHighlight: (highlightId: string) => Promise<void>;
}

const mapApiHighlight = (apiHighlight: ApiHighlight): Highlight => ({
  id: apiHighlight.id,
  userId: apiHighlight.user_id,
  bookId: apiHighlight.book_id,
  chunkId: apiHighlight.chunk_id,
  text: apiHighlight.text,
  color: apiHighlight.color,
  startOffset: apiHighlight.start_offset,
  endOffset: apiHighlight.end_offset,
  chapter: apiHighlight.chapter,
  note: apiHighlight.note
    ? {
        id: apiHighlight.note.id,
        highlightId: apiHighlight.note.highlight_id,
        content: apiHighlight.note.content,
        createdAt: apiHighlight.note.created_at,
        updatedAt: apiHighlight.note.updated_at,
      }
    : null,
  createdAt: apiHighlight.created_at,
});

export const useHighlightStore = create<HighlightStore>()(
  persist(
    (set, get) => ({
      highlights: [],
      isLoading: false,
      error: null,

      fetchBookHighlights: async (bookId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await highlightsApi.getBookHighlights(bookId);
          if (response.success && response.data) {
            const highlights = response.data.map((h: any) => ({
              ...mapApiHighlight(h),
              bookTitle: h.book?.title,
              bookAuthor: h.book?.author,
              bookCoverUrl: h.book?.cover_url,
            }));
            set({ highlights, isLoading: false });
          }
        } catch (error: any) {
          set({
            error: error.message || "获取划线列表失败",
            isLoading: false,
          });
        }
      },

      fetchAllHighlights: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await highlightsApi.getAll();
          if (response.success && response.data) {
            const highlights = response.data.map((h: any) => ({
              ...mapApiHighlight(h),
              bookTitle: h.book?.title,
              bookAuthor: h.book?.author,
              bookCoverUrl: h.book?.cover_url,
            }));
            set({ highlights, isLoading: false });
          }
        } catch (error: any) {
          set({
            error: error.message || "获取划线列表失败",
            isLoading: false,
          });
        }
      },

      addHighlight: async (bookId, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await highlightsApi.create(bookId, data);
          if (response.success && response.data) {
            const newHighlight = mapApiHighlight(response.data);
            set((state) => ({
              highlights: [...state.highlights, newHighlight],
              isLoading: false,
            }));
          }
        } catch (error: any) {
          set({
            error: error.message || "添加划线失败",
            isLoading: false,
          });
          throw error;
        }
      },

      deleteHighlight: async (highlightId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await highlightsApi.delete(highlightId);
          if (response.success) {
            set((state) => ({
              highlights: state.highlights.filter((h) => h.id !== highlightId),
              isLoading: false,
            }));
          }
        } catch (error: any) {
          set({
            error: error.message || "删除划线失败",
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: "highlight-storage",
      partialize: (state) => ({
        highlights: state.highlights,
      }),
    }
  )
);
