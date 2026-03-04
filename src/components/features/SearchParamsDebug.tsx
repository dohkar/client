"use client";

import { useSearchParams } from "next/navigation";

/**
 * Временный компонент для отладки: выводит в консоль текущее значение useSearchParams().
 * Добавлен рядом с SearchPageClient внутри Suspense. Если видит пустой sp при URL с query —
 * проблема в конфигурации Next.js или в границе Suspense.
 */
export function SearchParamsDebug() {
  const sp = useSearchParams();
  if (typeof window !== "undefined") {
    console.log("SearchParamsDebug:", sp.toString());
  }
  return null;
}
