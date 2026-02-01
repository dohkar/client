"use client";

import { useCallback } from "react";

import { useAuthStore } from "@/stores/auth.store";

import { useAuthModalStore } from "./model/auth-modal.store";
import type { AuthIntent } from "./model/types";

/**
 * Хук для проверки авторизации перед выполнением действия.
 * Если пользователь не авторизован — открывается модальное окно авторизации.
 *
 * @example
 * ```tsx
 * function CheckoutButton() {
 *   const requireAuth = useRequireAuth();
 *
 *   const handleCheckout = () => {
 *     requireAuth(() => {
 *       router.push('/checkout');
 *     }, { type: 'checkout' });
 *   };
 *
 *   return <button onClick={handleCheckout}>Оформить заказ</button>;
 * }
 * ```
 */
export function useRequireAuth() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { open } = useAuthModalStore();

  const requireAuth = useCallback(
    async <T = void>(
      callback: () => T | Promise<T>,
      intent?: AuthIntent
    ): Promise<T | undefined> => {
      if (!isInitialized) {
        return undefined;
      }

      if (isAuthenticated) {
        return (await callback()) as T;
      }

      open(intent);
      return undefined;
    },
    [isAuthenticated, isInitialized, open]
  );

  return requireAuth;
}
