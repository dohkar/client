"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { maskContact } from "../lib/utils";
import {
  ERROR_MESSAGES,
  OTP_LENGTH,
  OTP_RESEND_COOLDOWN,
} from "../model/constants";

interface OtpStepProps {
  contact: string;
  onSubmit: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Второй шаг модального окна авторизации — ввод OTP кода
 */
export function OtpStep({
  contact,
  onSubmit,
  onResend,
  onBack,
  isLoading = false,
  error,
}: OtpStepProps) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendCooldown, setResendCooldown] = useState(OTP_RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    setCanResend(true);
    return undefined;
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === OTP_LENGTH - 1 && newOtp.every((d) => d)) {
      void handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, OTP_LENGTH).split("");
    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      newOtp[index] = digit;
    });
    setOtp(newOtp);

    const nextEmptyIndex = newOtp.findIndex((d) => !d);
    const focusIndex =
      nextEmptyIndex === -1 ? OTP_LENGTH - 1 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();

    if (newOtp.every((d) => d)) {
      void handleSubmit(newOtp.join(""));
    }
  };

  const handleSubmit = async (otpCode: string) => {
    try {
      await onSubmit(otpCode);
    } catch {
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendCooldown(OTP_RESEND_COOLDOWN);
    try {
      await onResend();
    } catch {
      setCanResend(true);
      setResendCooldown(0);
    }
  };

  const maskedContact = maskContact(contact);

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute left-4 top-4 h-8 w-8 p-0 min-h-[44px] min-w-[44px]"
        disabled={isLoading}
        aria-label="Назад к вводу контакта"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="text-center pt-2">
        <h2 className="text-2xl font-bold">Введите код</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Код отправлен на {maskedContact}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isLoading}
              className="h-14 w-14 text-center text-xl font-semibold min-h-[44px]"
              aria-label={`Цифра ${index + 1}`}
              aria-invalid={!!error}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="text-center">
          {canResend ? (
            <Button
              type="button"
              variant="link"
              onClick={handleResend}
              disabled={isLoading}
              className="h-auto p-0 text-sm"
            >
              Отправить код повторно
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Отправить повторно через {resendCooldown} сек
            </p>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
