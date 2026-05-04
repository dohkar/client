"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { fetchAddressSuggestions } from "@/lib/fetch-address-suggestions";
import type { GeocodeResult } from "@/lib/dadata-geocoder";
import {
  ADDRESS_SUGGEST_DEBOUNCE_MS,
  ADDRESS_SUGGEST_MIN_QUERY_CHARS,
  ADDRESS_SUGGEST_SUPPRESS_AFTER_PICK_MS,
} from "@/lib/search-constants";
import type { FetchAddressSuggestionsOptions } from "@/lib/fetch-address-suggestions";

type UseAddressSuggestionsResult = {
  suggestions: GeocodeResult[];
  suggestLoading: boolean;
  listOpen: boolean;
  setListOpen: (open: boolean) => void;
  /** Вызвать сразу после выбора подсказки: очищает список и блокирует запросы на короткое время (экономия DaData). */
  suppressSuggestionsAfterPick: () => void;
};

/**
 * Debounced-подсказки адреса (DaData) с отменой запросов.
 *
 * Практики:
 * 1. **Trailing debounce** — запрос только после паузы ввода, не на каждый символ.
 * 2. **AbortController** — при новом вводе отменяется предыдущий fetch (меньше сети и нет «мигания» старых результатов).
 * 3. **Минимальная длина** — не вызывать API на слишком коротких строках.
 * 4. **Suppress после выбора** — при выборе подсказки `location` в форме становится полным адресом; без паузы
 *    это снова запустило бы suggest. Подавление на ~1 с убирает лишний платный вызов.
 * 5. **Cleanup** — при размонтировании или смене `query` таймер и HTTP отменяются.
 */
export function useAddressSuggestions(
  query: string,
  suggestOptions?: FetchAddressSuggestionsOptions
): UseAddressSuggestionsResult {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  const suppressUntilRef = useRef(0);
  const requestEpochRef = useRef(0);

  const suppressSuggestionsAfterPick = useCallback(() => {
    suppressUntilRef.current = Date.now() + ADDRESS_SUGGEST_SUPPRESS_AFTER_PICK_MS;
    requestEpochRef.current += 1;
    setSuggestions([]);
    setListOpen(false);
    setSuggestLoading(false);
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (now < suppressUntilRef.current) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < ADDRESS_SUGGEST_MIN_QUERY_CHARS) {
      requestEpochRef.current += 1;
      startTransition(() => {
        setSuggestions([]);
        setListOpen(false);
        setSuggestLoading(false);
      });
      return;
    }

    const ac = new AbortController();
    const epochAtSchedule = ++requestEpochRef.current;

    const timerId = window.setTimeout(() => {
      setSuggestLoading(true);
      void fetchAddressSuggestions(trimmed, ac.signal, suggestOptions)
        .then((list) => {
          if (ac.signal.aborted) return;
          if (epochAtSchedule !== requestEpochRef.current) return;
          setSuggestions(list);
          setListOpen(list.length > 0);
        })
        .catch((err: unknown) => {
          if (ac.signal.aborted) return;
          if (err instanceof DOMException && err.name === "AbortError") return;
          if (epochAtSchedule !== requestEpochRef.current) return;
          setSuggestions([]);
          setListOpen(false);
        })
        .finally(() => {
          if (ac.signal.aborted) return;
          if (epochAtSchedule !== requestEpochRef.current) return;
          setSuggestLoading(false);
        });
    }, ADDRESS_SUGGEST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timerId);
      ac.abort();
    };
  }, [query, suggestOptions?.boostRegion]);

  return {
    suggestions,
    suggestLoading,
    listOpen,
    setListOpen,
    suppressSuggestionsAfterPick,
  };
}
