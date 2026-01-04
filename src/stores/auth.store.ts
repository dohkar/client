import { create } from "zustand";
import { authService } from "@/services/auth.service";
import { cookieStorage } from "@/lib/cookie-storage";
import type { User } from "@/types";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateUser: (updates: Partial<User>) => void;
  checkAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Ошибка входа";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null, // Clear error on success
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Ошибка регистрации";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Сервер очистит httpOnly cookies
          await authService.logout();
        } catch (error: unknown) {
          // Logging error is not critical, state should be cleared anyway
          // Optionally report to monitoring in production
        } finally {
          // Очищаем состояние (httpOnly cookies очищаются сервером)
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });

        // Не можем проверить httpOnly cookies на клиенте
        // Просто пытаемся получить пользователя - если токен есть, сервер вернет данные
        try {
          const response = await authService.getCurrentUser();
          if (response && response.status === "success" && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Неожиданный формат ответа - пользователь не авторизован
            set({
              user: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
            });
          }
        } catch (error: unknown) {
          // Токен невалиден или отсутствует - пользователь не авторизован
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error: null,
          });
        }
      },

      initialize: async () => {
        if (get().isInitialized) return;
        await get().checkAuth();
      },

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "auth-store",
      version: 1,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        error: state.error,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

// Initialize on client-side only, on module load
if (typeof window !== "undefined") {
  void useAuthStore.getState().initialize();
}
