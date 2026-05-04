"use client";

import { useMemo, useSyncExternalStore } from "react";
import { DEFAULT_SEARCH_REGION } from "@/constants/defaults";
import { REGION_MAP } from "@/lib/url/segments";
import { REGION_SLUG_TO_NAME } from "@/lib/regions";

export const USER_REGION_COOKIE = "user_region";
const GPS_REGION_STORAGE_KEY = "dohkar.gpsRegionSlug.v1";

function getRegionFromCookie(): string {
  if (typeof document === "undefined") return DEFAULT_SEARCH_REGION;

  try {
    const gps = localStorage.getItem(GPS_REGION_STORAGE_KEY);
    if (gps && gps in REGION_MAP && gps !== "all") return gps;
  } catch {
    // ignore
  }

  const match = document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${USER_REGION_COOKIE}=`));
  const val = match?.split("=")[1]?.trim();
  return val && val in REGION_MAP && val !== "all" ? val : DEFAULT_SEARCH_REGION;
}

/**
 * Регион пользователя из cookie (устанавливается middleware по IP).
 * Используется для редиректа с главной, сброса фильтров и сортировки списка регионов.
 */
export function useUserRegion(): string {
  return useSyncExternalStore(
    // cookie не меняется без действий пользователя — подписка пустая
    () => {
      return () => {};
    },
    () => getRegionFromCookie(), // клиент
    () => DEFAULT_SEARCH_REGION // сервер
  );
}

export function writeGpsRegionSlug(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GPS_REGION_STORAGE_KEY, slug);
  } catch {
    // ignore
  }
  try {
    document.cookie = `${USER_REGION_COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=${
      60 * 60 * 24 * 30
    }; samesite=lax`;
  } catch {
    // ignore
  }
}

const SLUG_TO_REGION_VALUE: Record<string, string> = { ...REGION_SLUG_TO_NAME };

export type RegionOption = { value: string; label: string };

/**
 * Опции регионов для селекта: «Все регионы» первым, затем регион пользователя, остальные.
 */
export function useSortedRegionOptions(options: readonly RegionOption[]): RegionOption[] {
  const userRegionSlug = useUserRegion();

  return useMemo(() => {
    const list = [...options];
    const allOpt = list.find((o) => o.value === "all");
    const userValue = SLUG_TO_REGION_VALUE[userRegionSlug];
    const userOpt = list.find((o) => o.value === userValue);
    const rest = list.filter((o) => o.value !== "all" && o.value !== userValue);
    return [allOpt, userOpt, ...rest].filter((o): o is RegionOption => o != null);
  }, [options, userRegionSlug]);
}
