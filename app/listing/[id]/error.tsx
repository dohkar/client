"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ListingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логирование в мониторинг при необходимости
  }, [error]);

  return (
    <div className="container max-w-lg mx-auto py-16 px-4 text-center">
      <h1 className="text-xl font-bold mb-2">Что-то пошло не так</h1>
      <p className="text-muted-foreground mb-6">
        Не удалось загрузить объявление. Попробуйте обновить страницу или вернуться к поиску.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={reset} variant="default">
          Попробовать снова
        </Button>
        <Button asChild variant="outline">
          <Link href={ROUTES.search}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            К поиску
          </Link>
        </Button>
      </div>
    </div>
  );
}
