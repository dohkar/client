"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/constants";

import { normalizeContact } from "@/lib/contact-utils";
import { useAuthModalStore } from "../model/auth-modal.store";
import { SUCCESS_AUTO_CLOSE_DELAY } from "../model/constants";
import { ERROR_MESSAGES } from "../model/constants";
import { AuthModalStep } from "../model/types";

import { LoginStep } from "./LoginStep";
import { OtpStep } from "./OtpStep";
import { SuccessStep } from "./SuccessStep";

/**
 * Содержимое модального окна авторизации (шаги CONTACT → OTP → SUCCESS)
 */
export function AuthModalContent() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    currentStep,
    contact,
    intent,
    error,
    isLoading,
    setStep,
    setContact,
    setError,
    setLoading,
    close,
  } = useAuthModalStore();

  const { sendOtp, verifyOtp, user } = useAuthStore();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSendOtp = useCallback(
    async (inputContact: string) => {
      setLoading(true);
      setContact(inputContact);
      setError(null);

      try {
        const { contact: normalized, method } = normalizeContact(inputContact);

        if (method === "email") {
          setError(ERROR_MESSAGES.EMAIL_NOT_SUPPORTED);
          return;
        }

        await sendOtp(normalized);
        setStep(AuthModalStep.OTP);
      } catch (err) {
        setError(err instanceof Error ? err.message : ERROR_MESSAGES.OTP_SEND_FAILED);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sendOtp, setContact, setError, setLoading, setStep]
  );

  const handleVerifyOtp = useCallback(
    async (otp: string) => {
      setLoading(true);
      setError(null);

      try {
        const { contact: normalized, method } = normalizeContact(contact);

        if (method !== "phone") {
          setError(ERROR_MESSAGES.OTP_VERIFY_FAILED);
          return;
        }

        await verifyOtp({ phone: normalized, code: otp });
        setStep(AuthModalStep.SUCCESS);

        timeoutRef.current = setTimeout(() => {
          close();
          useAuthModalStore.getState().reset();

          if (intent.type === "checkout") {
            router.push(ROUTES.dashboard);
          } else if (intent.type === "profile") {
            router.push(`${ROUTES.dashboard}/profile`);
          } else if (intent.type === "orders") {
            router.push(`${ROUTES.dashboard}/listings`);
          } else if (intent.type === "custom") {
            router.push(intent.url);
          }
        }, SUCCESS_AUTO_CLOSE_DELAY);
      } catch (err) {
        setError(err instanceof Error ? err.message : ERROR_MESSAGES.OTP_VERIFY_FAILED);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [contact, verifyOtp, setError, setLoading, setStep, close, intent, router]
  );

  const handleResendOtp = useCallback(async () => {
    await handleSendOtp(contact);
  }, [contact, handleSendOtp]);

  const handleBack = useCallback(() => {
    setStep(AuthModalStep.CONTACT);
  }, [setStep]);

  switch (currentStep) {
    case AuthModalStep.CONTACT:
      return (
        <LoginStep
          onSubmit={handleSendOtp}
          initialContact={contact}
          isLoading={isLoading}
          error={error}
        />
      );

    case AuthModalStep.OTP:
      return (
        <OtpStep
          contact={contact}
          onSubmit={handleVerifyOtp}
          onResend={handleResendOtp}
          onBack={handleBack}
          isLoading={isLoading}
          error={error}
        />
      );

    case AuthModalStep.SUCCESS:
      return <SuccessStep userName={user?.name} />;

    default:
      return null;
  }
}
