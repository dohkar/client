"use client";

import { useCallback } from "react";

import { useAuthModalStore } from "./model/auth-modal.store";
import type { AuthIntent } from "./model/types";

/**
 * Хук для управления модальным окном авторизации
 *
 * @example
 * ```tsx
 * const { openAuthModal } = useAuthModal();
 * return <button onClick={() => openAuthModal()}>Войти</button>;
 * ```
 *
 * @example
 * ```tsx
 * openAuthModal({ type: 'checkout' });
 * openAuthModal({ type: 'profile' });
 * openAuthModal({ type: 'custom', url: '/favorites' });
 * ```
 */
export function useAuthModal() {
  const { open, close, isOpen } = useAuthModalStore();

  const openAuthModal = useCallback(
    (intent?: AuthIntent) => {
      open(intent);
    },
    [open]
  );

  const closeAuthModal = useCallback(() => {
    close();
  }, [close]);

  return {
    openAuthModal,
    closeAuthModal,
    isAuthModalOpen: isOpen,
  };
}
