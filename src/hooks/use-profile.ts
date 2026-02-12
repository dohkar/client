"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { usersService } from "@/services/users.service";
import { uploadService, validateImageFile, ALLOWED_IMAGE_TYPES } from "@/services/upload.service";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { queryKeys } from "@/lib/react-query/query-keys";
import { formatPhoneInput } from "@/lib/utils/format";
import { normalizePhone } from "@/lib/contact-utils";
import type { User } from "@/types";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(50, "Имя не должно превышать 50 символов")
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s-]+$/, "Имя может содержать только буквы, пробелы и дефисы"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[0-9\s\-()]{10,20}$/.test(val),
      "Введите корректный номер телефона"
    ),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Введите корректный email"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export function useProfile() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Запрос данных пользователя
  const {
    data: currentUser,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: async () => {
      const response = await authService.getCurrentUser();
      if (response) {
        const user: User = {
          id: response.id,
          name: response.name,
          email: response.email,
          phone: response.phone,
          avatar: response.avatar,
          isPremium: response.isPremium,
          role: response.role as User["role"],
          createdAt: response.createdAt,
          provider: (response as User & { provider?: User["provider"] }).provider,
        };
        setUser(user);
      }
      return response;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Форма
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, dirtyFields },
    reset,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });

  // Инициализация формы при загрузке данных
  useEffect(() => {
    if (currentUser) {
      const rawPhone = currentUser.phone || "";
      reset({
        name: currentUser.name || "",
        phone: rawPhone ? formatPhoneInput(rawPhone) : "",
        email: currentUser.email ?? "",
      });
    }
  }, [currentUser, reset]);

  // Мутация обновления профиля
  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => usersService.updateUser(data),
    onSuccess: async () => {
      const updatedUser = await authService.getCurrentUser();
      const userForStore: User = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        isPremium: updatedUser.isPremium,
        role: updatedUser.role as User["role"],
        createdAt: updatedUser.createdAt,
        provider: (updatedUser as User & { provider?: User["provider"] }).provider,
      };
      setUser(userForStore);
      queryClient.setQueryData(queryKeys.auth.user(), updatedUser);
      const rawPhone = updatedUser.phone || "";
      reset({
        name: updatedUser.name || "",
        phone: rawPhone ? formatPhoneInput(rawPhone) : "",
        email: updatedUser.email ?? "",
      });
      toast.success("Профиль успешно обновлён");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка обновления профиля");
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    const payload = {
      ...data,
      phone: data.phone?.trim() ? `+${normalizePhone(data.phone)}` : undefined,
    };
    updateMutation.mutate(payload);
  };

  // Обработчик выбора файла аватара
  const handleAvatarSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Валидация на клиенте
      const validationError = validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Создаем превью
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setIsAvatarUploading(true);

      try {
        // Загружаем на сервер
        const result = await uploadService.uploadAvatar(file);

        // Обновляем данные пользователя
        const updatedUser = await authService.getCurrentUser();
        const userForStore: User = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          isPremium: updatedUser.isPremium,
          role: updatedUser.role as User["role"],
          createdAt: updatedUser.createdAt,
          provider: (updatedUser as User & { provider?: User["provider"] }).provider,
        };
        setUser(userForStore);
        queryClient.setQueryData(queryKeys.auth.user(), updatedUser);

        toast.success("Аватар успешно обновлен");

        // Очищаем локальное превью - теперь используем URL с сервера
        setAvatarPreview(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка загрузки аватара");
        // Очищаем превью при ошибке
        setAvatarPreview(null);
      } finally {
        setIsAvatarUploading(false);
        // Очищаем input для возможности повторной загрузки того же файла
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Очищаем object URL
        URL.revokeObjectURL(previewUrl);
      }
    },
    [queryClient, setUser]
  );

  // Открытие диалога выбора файла
  const handleAvatarClick = useCallback(() => {
    if (!isAvatarUploading) {
      fileInputRef.current?.click();
    }
  }, [isAvatarUploading]);

  // Сброс формы
  const handleReset = useCallback(() => {
    if (currentUser) {
      const rawPhone = currentUser.phone || "";
      reset({
        name: currentUser.name || "",
        phone: rawPhone ? formatPhoneInput(rawPhone) : "",
        email: currentUser.email ?? "",
      });
    }
  }, [currentUser, reset]);

  // Количество изменённых полей
  const changedFieldsCount = Object.keys(dirtyFields).length;

  // URL аватара для отображения: превью или текущий
  const displayAvatarUrl = avatarPreview || currentUser?.avatar || undefined;

  return {
    currentUser,
    isLoading,
    isError,
    refetch,
    register,
    handleSubmit,
    errors,
    isDirty,
    changedFieldsCount,
    onSubmit,
    onReset: handleReset,
    isSubmitting: updateMutation.isPending,
    displayAvatarUrl,
    isAvatarUploading,
    fileInputRef,
    handleAvatarSelect,
    handleAvatarClick,
    setValue,
  };
}
