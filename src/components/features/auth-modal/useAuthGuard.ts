"use client";

import { useCallback } from "react";

import { useAuthStore } from "@/stores/auth.store";

import { useAuthModalStore } from "./model/auth-modal.store";
import type { AuthIntent } from "./model/types";

/**
 * Хук для проверки авторизации с автоматическим открытием модалки.
 *
 * @example
 * ```tsx
 * function ProtectedButton() {
 *   const { checkAuth } = useAuthGuard();
 *
 *   const handleClick = () => {
 *     if (!checkAuth({ type: 'checkout' })) return;
 *     router.push('/checkout');
 *   };
 *
 *   return <button onClick={handleClick}>Оформить</button>;
 * }
 * ```
 */
export function useAuthGuard() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { open } = useAuthModalStore();

  const checkAuth = useCallback(
    (intent?: AuthIntent): boolean => {
      if (!isInitialized) {
        return false;
      }

      if (isAuthenticated) {
        return true;
      }

      open(intent);
      return false;
    },
    [isAuthenticated, isInitialized, open]
  );

  return {
    checkAuth,
    isAuthenticated,
  };
}
