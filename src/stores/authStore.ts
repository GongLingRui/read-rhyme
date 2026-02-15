/**
 * Authentication Store
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService, type User } from "@/services/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.error?.message || "登录失败");
          }
        } catch (error: any) {
          set({
            error: error.message || "登录失败",
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (email, username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({ email, username, password });
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.error?.message || "注册失败");
          }
        } catch (error: any) {
          set({
            error: error.message || "注册失败",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      initAuth: () => {
        const isAuthenticated = authService.initAuth();
        const user = authService.getUser();
        if (isAuthenticated && user) {
          set({
            user,
            isAuthenticated: true,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
