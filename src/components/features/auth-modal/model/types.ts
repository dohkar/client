/**
 * Типы для модального окна авторизации
 */

/** Шаги модалки: контакт → OTP → успех */
export enum AuthModalStep {
  CONTACT = "contact",
  OTP = "otp",
  SUCCESS = "success",
}

/** Цель открытия модалки (редирект после входа) */
export type AuthIntent =
  | { type: "none" }
  | { type: "checkout" }
  | { type: "profile" }
  | { type: "orders" }
  | { type: "custom"; url: string };

export interface AuthModalStore {
  isOpen: boolean;
  currentStep: AuthModalStep;
  contact: string;
  intent: AuthIntent;
  error: string | null;
  isLoading: boolean;

  open: (intent?: AuthIntent) => void;
  close: () => void;
  setStep: (step: AuthModalStep) => void;
  setContact: (contact: string) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
  resetIfNeeded: () => void;
}
