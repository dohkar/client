import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { authService } from "@/services/auth.service";
import type { User } from "@/types";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";

/**
 * Хук для получения текущего пользователя
 */
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery<User>({
    queryKey: queryKeys.auth.user(),
    queryFn: async () => {
      const response = await authService.getCurrentUser();
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: user ?? undefined,
  });
}

/**
 * Хук для входа
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authService.login(credentials),
    onSuccess: (data) => {
      // Устанавливаем пользователя и помечаем как авторизованного
      setUser(data.user);
      queryClient.setQueryData(queryKeys.auth.user(), data.user);

      // Обновляем флаг инициализации
      useAuthStore.setState({ isInitialized: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка входа");
    },
  });
}

/**
 * Хук для регистрации
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => authService.register(data),
    onSuccess: (response) => {
      // Устанавливаем пользователя и помечаем как авторизованного
      setUser(response.user);
      queryClient.setQueryData(queryKeys.auth.user(), response.user);

      // Обновляем флаг инициализации
      useAuthStore.setState({ isInitialized: true });

      toast.success("Регистрация успешна");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка регистрации");
    },
  });
}

/**
 * Хук для выхода
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear();
      toast.success("Вы вышли из системы");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка выхода");
    },
  });
}

/**
 * Хук для восстановления пароля
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: () => {
      toast.success("Инструкции отправлены на email");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка восстановления пароля");
    },
  });
}
