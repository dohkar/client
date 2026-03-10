"use client";

import { useMutation } from "@tanstack/react-query";
import { loginWithTelegram, type TelegramUser } from "@/services/telegram-auth.service";
import { useAuthStore } from "@/stores/auth.store";

export interface UseTelegramAuthOptions {
  onSuccess?: () => void;
}

export function useTelegramAuth(options?: UseTelegramAuthOptions) {
  const initialize = useAuthStore((s) => s.initialize);

  return useMutation({
    mutationFn: (data: TelegramUser) => loginWithTelegram(data),
    onSuccess: () => {
      initialize();
      options?.onSuccess?.();
    },
  });
}
