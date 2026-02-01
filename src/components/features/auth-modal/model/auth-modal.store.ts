/**
 * Zustand store для модального окна авторизации
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { AuthModalStore } from "./types";
import { AuthModalStep } from "./types";

const initialState = {
  isOpen: false,
  currentStep: AuthModalStep.CONTACT,
  contact: "",
  intent: { type: "none" as const },
  error: null as string | null,
  isLoading: false,
};

/**
 * Store для управления модальным окном авторизации
 *
 * @example
 * ```ts
 * const { open, close, setStep } = useAuthModalStore();
 *
 * // Открыть модалку для обычного логина
 * open();
 *
 * // Открыть модалку с intent для checkout
 * open({ type: 'checkout' });
 * ```
 */
export const useAuthModalStore = create<AuthModalStore>()(
  devtools(
    (set) => ({
      ...initialState,

      open: (intent = { type: "none" }) =>
        set((state) => {
          const shouldReset =
            state.currentStep === AuthModalStep.CONTACT || !state.contact;

          return {
            isOpen: true,
            intent,
            currentStep: shouldReset ? AuthModalStep.CONTACT : state.currentStep,
            error: null,
            contact: shouldReset ? "" : state.contact,
          };
        }),

      close: () =>
        set({
          isOpen: false,
        }),

      setStep: (step) =>
        set({
          currentStep: step,
          error: null,
        }),

      setContact: (contact) =>
        set({
          contact,
        }),

      setError: (error) =>
        set({
          error,
          isLoading: false,
        }),

      setLoading: (isLoading) =>
        set((state) => ({
          isLoading,
          ...(isLoading ? { error: null } : {}),
        })),

      reset: () => set(initialState),

      resetIfNeeded: () =>
        set((state) => {
          if (state.currentStep === AuthModalStep.CONTACT) {
            return initialState;
          }
          return { ...state, isOpen: false };
        }),
    }),
    { name: "AuthModalStore" }
  )
);
