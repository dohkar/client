import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { authService } from "@/services/auth.service";
import type { User } from "@/types";
import type { UserResponseDto } from "@/lib/api-types";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";

// Function to map UserResponseDto to User
function mapUserResponseToUser(userResponse: UserResponseDto): User {
  return {
    id: userResponse.id,
    name: userResponse.name,
    email: userResponse.email,
    phone: userResponse.phone,
    avatar: userResponse.avatar,
    isPremium: userResponse.isPremium,
    role: userResponse.role as User["role"],
    createdAt: userResponse.createdAt,
  };
}

/**
 * Хук для получения текущего пользователя
 */
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery<User>({
    queryKey: queryKeys.auth.user(),
    queryFn: async () => {
      const userResponse = await authService.getCurrentUser();
      return mapUserResponseToUser(userResponse);
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
    mutationFn: (credentials: { phone: string; password: string }) =>
      authService.login(credentials),
    onSuccess: (userResponse) => {
      const user = mapUserResponseToUser(userResponse);
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.user(), user);
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
    mutationFn: (data: { phone: string; password: string }) =>
      authService.register(data),
    onSuccess: (userResponse) => {
      const user = mapUserResponseToUser(userResponse);
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.user(), user);
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
// Примечание: Метод forgotPassword не представлен в текущей OpenAPI спецификации
