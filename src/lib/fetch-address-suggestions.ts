import type { GeocodeResult } from "@/lib/dadata-geocoder";

export interface AddressSuggestResponse {
  suggestions: GeocodeResult[];
}

/**
 * Подсказки адреса через прокси Next.js.
 * @param signal — для отмены при смене запроса (AbortController); уменьшает гонки и лишние обновления UI.
 */
export async function fetchAddressSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const response = await fetch("/api/suggest-address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
    signal,
  });

  if (!response.ok) return [];

  const data = (await response.json()) as AddressSuggestResponse;
  return Array.isArray(data.suggestions) ? data.suggestions : [];
}
