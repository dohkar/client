"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";

import { detectContactType, validateContact, formatPhoneInput } from "../lib/utils";
import { ERROR_MESSAGES } from "../model/constants";
import { cn } from "@/lib/utils";

interface LoginStepProps {
  onSubmit: (contact: string) => Promise<void>;
  initialContact?: string;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Первый шаг модального окна авторизации — ввод email или телефона
 */
export function LoginStep({
  onSubmit,
  initialContact = "",
  isLoading = false,
  error: externalError,
}: LoginStepProps) {
  const [contact, setContact] = useState(initialContact);
  const [localError, setLocalError] = useState<string | null>(null);

  const contactType = detectContactType(contact);
  const isValid = validateContact(contact);
  const error = externalError ?? localError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!isValid) {
      setLocalError(ERROR_MESSAGES.INVALID_CONTACT);
      return;
    }

    try {
      await onSubmit(contact);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : ERROR_MESSAGES.OTP_SEND_FAILED);
    }
  };

  const placeholder = contactType === "email" ? "example@email.com" : "+7 (___) __-__-__";

  return (
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold text-center'>Войти или создать профиль</h2>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-2'>
          <Input
            id='auth-contact'
            type='text'
            inputMode={contactType === "phone" ? "tel" : "email"}
            placeholder={placeholder}
            value={contact}
            onChange={(e) => {
              const inputValue = e.target.value;

              if (
                inputValue.includes("@") ||
                (inputValue.length > 0 && /^[a-zA-Z]/.test(inputValue))
              ) {
                setContact(inputValue);
                setLocalError(null);
                return;
              }

              const digitsCount = (inputValue.match(/\d/g) || []).length;
              const isPhoneInput = digitsCount > 0 && /^[\d+7\s\-()]*$/.test(inputValue);

              if (isPhoneInput) {
                setContact(formatPhoneInput(inputValue));
              } else {
                setContact(inputValue);
              }
              setLocalError(null);
            }}
            disabled={isLoading}
            className={cn(
              "w-full h-14 px-5 text-base font-medium tracking-wider",
              "bg-background border border-input rounded-xl shadow-sm",
              "placeholder:text-muted-foreground",
              "focus:border-primary focus:ring-2 focus:ring-primary/30 focus:shadow-md",
              "transition-all duration-100",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "min-h-[48px] touch-manipulation"
            )}
            autoFocus
            autoComplete='username'
            aria-invalid={!!error}
            aria-describedby={error ? "auth-contact-error" : undefined}
          />

          {error && (
            <p id='auth-contact-error' className='text-sm text-destructive' role='alert'>
              {error}
            </p>
          )}
        </div>

        <Button
          type='submit'
          className='w-full h-12 text-base font-medium min-h-[44px]'
          disabled={!isValid || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Отправка...
            </>
          ) : (
            "Получить код"
          )}
        </Button>
      </form>

      <div className='text-center text-xs text-muted-foreground leading-relaxed'>
        Нажимая на кнопку, я соглашаюсь{" "}
        <Link href={ROUTES.terms} className='text-primary underline hover:no-underline'>
          с правилами пользования торговой площадкой
        </Link>
        .<br />
        <Link href={ROUTES.privacy} className='text-primary underline hover:no-underline'>
          Политика конфиденциальности
        </Link>
      </div>
    </div>
  );
}
