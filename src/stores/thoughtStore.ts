/**
 * Thought Store with API integration
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { thoughtsApi, type Thought as ApiThought } from "@/services";

export interface Thought {
  id: string;
  userId: string;
  bookId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCoverUrl?: string;
}

interface ThoughtStore {
  thoughts: Thought[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchThoughts: (params?: { book_id?: string; page?: number; page_size?: number }) => Promise<void>;
  fetchBookThoughts: (bookId: string) => Promise<void>;
  addThought: (thought: Thought) => void;
  updateThought: (thoughtId: string, content: string) => Promise<void>;
  deleteThought: (thoughtId: string) => Promise<void>;
  createThought: (bookId: string, content: string) => Promise<Thought>;
}

const mapApiThought = (apiThought: ApiThought): Thought => ({
  id: apiThought.id,
  userId: apiThought.user_id,
  bookId: apiThought.book_id,
  content: apiThought.content,
  createdAt: apiThought.created_at,
  updatedAt: apiThought.updated_at,
  bookTitle: apiThought.book_title,
  bookAuthor: apiThought.book_author,
  bookCoverUrl: apiThought.book_cover_url,
});

export const useThoughtStore = create<ThoughtStore>()(
  persist(
    (set, get) => ({
      thoughts: [],
      isLoading: false,
      error: null,

      fetchThoughts: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
          const response = await thoughtsApi.list(params);
          if (response.success && response.data) {
            const thoughts = response.data.map(mapApiThought);
            set({ thoughts, isLoading: false });
          }
        } catch (error: any) {
          set({
            error: error.message || "获取想法列表失败",
            isLoading: false,
          });
        }
      },

      fetchBookThoughts: async (bookId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await thoughtsApi.getBookThoughts(bookId);
          if (response.success && response.data) {
            const thoughts = response.data.map(mapApiThought);
            set({ thoughts, isLoading: false });
          }
        } catch (error: any) {
          set({
            error: error.message || "获取想法列表失败",
            isLoading: false,
          });
        }
      },

      addThought: (thought) => {
        set((state) => ({ thoughts: [thought, ...state.thoughts] }));
      },

      updateThought: async (thoughtId, content) => {
        set({ isLoading: true, error: null });
        try {
          const response = await thoughtsApi.update(thoughtId, { content });
          if (response.success && response.data) {
            const thought = mapApiThought(response.data);
            set((state) => ({
              thoughts: state.thoughts.map((t) =>
                t.id === thoughtId ? thought : t
              ),
              isLoading: false,
            }));
          }
        } catch (error: any) {
          set({
            error: error.message || "更新想法失败",
            isLoading: false,
          });
          throw error;
        }
      },

      deleteThought: async (thoughtId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await thoughtsApi.delete(thoughtId);
          if (response.success) {
            set((state) => ({
              thoughts: state.thoughts.filter((t) => t.id !== thoughtId),
              isLoading: false,
            }));
          }
        } catch (error: any) {
          set({
            error: error.message || "删除想法失败",
            isLoading: false,
          });
          throw error;
        }
      },

      createThought: async (bookId, content) => {
        set({ isLoading: true, error: null });
        try {
          const response = await thoughtsApi.create({ book_id: bookId, content });
          if (response.success && response.data) {
            const thought = mapApiThought(response.data);
            set((state) => ({
              thoughts: [thought, ...state.thoughts],
              isLoading: false,
            }));
            return thought;
          }
          throw new Error("创建想法失败");
        } catch (error: any) {
          set({
            error: error.message || "创建想法失败",
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: "thought-storage",
      partialize: (state) => ({
        thoughts: state.thoughts,
      }),
    }
  )
);
