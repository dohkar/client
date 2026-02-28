"use client";

import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConsent } from "./consent-provider";

export function CookieBanner() {
  const { consent, isReady, accept, decline } = useConsent();

  if (!isReady || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Согласие на обработку данных"
      aria-live="polite"
      className="
        fixed bottom-4 left-4 right-4
        sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px]
        z-50 bg-card border border-border
        rounded-2xl shadow-2xl p-5
        flex flex-col gap-4
      "
    >
      <div className="flex gap-3">
        <Cookie
          className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5"
          aria-hidden
        />
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">
            Мы используем файлы cookie
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Для корректной работы сайта, аналитики и персонализации. Нажимая
            «Принять», вы соглашаетесь с{" "}
            <Link
              href="/privacy"
              className="text-primary underline-offset-2 hover:underline"
            >
              политикой конфиденциальности
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={accept}
          className="flex-1 rounded-xl h-9"
        >
          Принять
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={decline}
          className="flex-1 rounded-xl h-9"
        >
          Отклонить
        </Button>
      </div>
    </div>
  );
}
