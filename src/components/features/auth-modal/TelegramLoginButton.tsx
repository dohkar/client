"use client";

import { useEffect, useRef } from "react";
import { useTelegramAuth } from "@/hooks/use-telegram-auth";
import type { TelegramUser } from "@/services/telegram-auth.service";

interface TelegramLoginButtonProps {
  botUsername: string;
  onError?: (msg: string) => void;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

export function TelegramLoginButton({ botUsername, onError, onSuccess }: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mutate, isPending } = useTelegramAuth({ onSuccess });

  useEffect(() => {
    if (!containerRef.current || !botUsername) return;

    window.onTelegramAuth = (user: TelegramUser) => {
      mutate(user, {
        onError: () => onError?.("Ошибка входа через Telegram"),
      });
    };

    if (containerRef.current.querySelector("script[data-telegram-login]")) {
      return () => {
        delete window.onTelegramAuth;
      };
    }

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [botUsername, mutate]);

  return (
    <div className="flex flex-col items-center gap-2">
      {isPending && (
        <p className="text-sm text-muted-foreground">Входим через Telegram...</p>
      )}
      <div ref={containerRef} />
    </div>
  );
}
