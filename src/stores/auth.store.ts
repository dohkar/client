import { create } from "zustand";
import { authService } from "@/services/auth.service";
import { cookieStorage } from "@/lib/cookie-storage";
import type { User } from "@/types";
import type { UserResponseDto } from "@/lib/api-types";
import { persist } from "zustand/middleware";
import {
  startSilentAuthScheduler,
  stopSilentAuthScheduler,
} from "@/lib/silent-auth-scheduler";

let silentAuthCleanup: (() => void) | null = null;

function startSilentAuthIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (!cookieStorage.getRefreshToken()) return;
  silentAuthCleanup?.();
  silentAuthCleanup = startSilentAuthScheduler(() => authService.silentRefresh());
}

function stopSilentAuth(): void {
  silentAuthCleanup?.();
  silentAuthCleanup = null;
  stopSilentAuthScheduler();
}

// Function to map UserResponseDto to User
function mapUserResponseToUser(userResponse: UserResponseDto & { provider?: string }): User {
  return {
    id: userResponse.id,
    name: userResponse.name,
    email: userResponse.email,
    phone: userResponse.phone,
    avatar: userResponse.avatar,
    isPremium: userResponse.isPremium,
    role: userResponse.role as User["role"],
    createdAt: userResponse.createdAt,
    provider: userResponse.provider as User["provider"],
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    phone: string;
    password: string;
  }) => Promise<void>;
  /** Отправить SMS-код на телефон (для входа по коду в модалке) */
  sendOtp: (phone: string) => Promise<void>;
  /** Подтвердить код и войти по SMS */
  verifyOtp: (params: { phone: string; code: string }) => Promise<void>;
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

      login: async (phone: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const userResponse = await authService.login({ phone, password });
          const user = mapUserResponseToUser(userResponse);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          startSilentAuthIfNeeded();
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
          const userResponse = await authService.register(data);
          const user = mapUserResponseToUser(userResponse);
          set({
            user,
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

      sendOtp: async (phone: string) => {
        await authService.sendCode(phone);
      },

      verifyOtp: async ({ phone, code }: { phone: string; code: string }) => {
        set({ isLoading: true, error: null });
        try {
          const userResponse = await authService.verifyCode(phone, code);
          const user = mapUserResponseToUser(userResponse as UserResponseDto);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          startSilentAuthIfNeeded();
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Неверный код";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        stopSilentAuth();
        try {
          await authService.logout();
        } catch (error: unknown) {
          // Logging error is not critical, state should be cleared anyway
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });

        try {
          const userResponse = await authService.getCurrentUser();
          if (userResponse) {
            const user = mapUserResponseToUser(userResponse);
            set({
              user,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
            });
          }
        } catch (error: unknown) {
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

  // Сброс состояния при редиректе на логин после неудачного refresh (401)
  window.addEventListener("auth:session-expired", () => {
    stopSilentAuth();
    cookieStorage.clearTokens();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      error: null,
    });
  });
}
