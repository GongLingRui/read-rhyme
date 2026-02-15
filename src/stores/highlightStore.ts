/**
 * Highlight Store with API integration
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { highlightsApi, type Highlight as ApiHighlight } from "@/services";

export type HighlightColor = "yellow" | "blue" | "green" | "pink";

export interface SavedHighlight {
  id: string;
  userId: string;
  bookId: string;
  chunkId?: string;
  text: string;
  color: HighlightColor;
  startOffset: number;
  endOffset: number;
  chapter?: string;
  note?: {
    id: string;
    highlightId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
}

interface HighlightStore {
  highlights: SavedHighlight[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchHighlights: (bookId: string) => Promise<void>;
  addHighlight: (h: Omit<SavedHighlight, "id" | "userId" | "createdAt">) => Promise<void>;
  updateNote: (id: string, note: string) => void;
  removeHighlight: (id: string) => void;
  getBookHighlights: (bookId: string) => SavedHighlight[];
}

const mapApiHighlight = (apiHighlight: ApiHighlight): SavedHighlight => ({
  id: apiHighlight.id,
  userId: apiHighlight.user_id,
  bookId: apiHighlight.book_id,
  chunkId: apiHighlight.chunk_id,
  text: apiHighlight.text,
  color: apiHighlight.color as HighlightColor,
  startOffset: apiHighlight.start_offset,
  endOffset: apiHighlight.end_offset,
  chapter: apiHighlight.chapter,
  note: apiHighlight.note,
  createdAt: apiHighlight.created_at,
});

export const useHighlightStore = create<HighlightStore>()(
  persist(
    (set, get) => ({
      highlights: [],
      isLoading: false,
      error: null,

      fetchHighlights: async (bookId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await highlightsApi.list(bookId);
          if (response.success && response.data) {
            const highlights = response.data.map(mapApiHighlight);
            set({ highlights, isLoading: false });
          }
        } catch (error: any) {
          set({
            error: error.message || "获取高亮失败",
            isLoading: false,
          });
        }
      },

      addHighlight: async (data) => {
        try {
          const response = await highlightsApi.create(data.bookId, {
            text: data.text,
            color: data.color,
            start_offset: data.startOffset,
            end_offset: data.endOffset,
            chapter: data.chapter,
            chunk_id: data.chunkId,
            note: data.note?.content,
          });
          if (response.success && response.data) {
            const newHighlight = mapApiHighlight(response.data);
            set((state) => ({ highlights: [...state.highlights, newHighlight] }));
          }
        } catch (error: any) {
          set({ error: error.message || "添加高亮失败" });
          throw error;
        }
      },

      updateNote: async (id, note) => {
        try {
          const response = await highlightsApi.setNote(id, note);
          if (response.success && response.data) {
            set((state) => ({
              highlights: state.highlights.map((h) =>
                h.id === id ? { ...h, note: response.data } : h
              ),
            }));
          }
        } catch (error: any) {
          set({ error: error.message || "更新笔记失败" });
          throw error;
        }
      },

      removeHighlight: async (id) => {
        try {
          await highlightsApi.delete(id);
          set((state) => ({
            highlights: state.highlights.filter((h) => h.id !== id),
          }));
        } catch (error: any) {
          set({ error: error.message || "删除高亮失败" });
          throw error;
        }
      },

      getBookHighlights: (bookId) =>
        get().highlights.filter((h) => h.bookId === bookId),
    }),
    {
      name: "highlight-storage",
      partialize: (state) => ({
        highlights: state.highlights,
      }),
    }
  )
);
