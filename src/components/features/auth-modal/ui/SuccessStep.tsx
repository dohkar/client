"use client";

import { CheckCircle2 } from "lucide-react";

import { formatUserName } from "@/lib/utils/format-name";

interface SuccessStepProps {
  userName?: string | null;
}

/**
 * Третий шаг модального окна авторизации — успешный вход
 */
export function SuccessStep({ userName }: SuccessStepProps) {
  const displayName = formatUserName(userName);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <CheckCircle2 className="h-16 w-16 text-green-500" aria-hidden />
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          {displayName && displayName !== "User"
            ? `Добро пожаловать, ${displayName}!`
            : "Вы вошли в систему"}
        </h2>
      </div>
    </div>
  );
}
