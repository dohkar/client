"use client";

import { useEffect, useRef } from "react";
import { reverseGeocode } from "@/lib/dadata-geocoder";
import { dadataRegionToListingRegion } from "@/components/features/listing-form/apply-address-from-dadata";
import { API_REGION_TO_SLUG } from "@/lib/url/segments";
import { writeGpsRegionSlug } from "@/hooks/use-user-region";

function canUseGeolocation(): boolean {
  return typeof navigator !== "undefined" && !!navigator.geolocation;
}

async function hasGrantedGeolocationPermission(): Promise<boolean> {
  // Не показываем браузерный prompt автоматически — только если уже granted.
  // Permissions API поддерживается не везде, поэтому fallback: false.
  try {
    const status = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    return status.state === "granted";
  } catch {
    return false;
  }
}

/**
 * Определяем регион пользователя по GPS (если уже есть разрешение),
 * сохраняем в localStorage + cookie, чтобы выдача могла приоритизировать регион.
 */
export function useDetectUserRegion(): void {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!canUseGeolocation()) return;

    void (async () => {
      const granted = await hasGrantedGeolocationPermission();
      if (!granted) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const rev = await reverseGeocode(lat, lon);
          const regionName = dadataRegionToListingRegion(rev?.components.region);
          const slug = API_REGION_TO_SLUG[regionName] ?? null;
          if (slug) writeGpsRegionSlug(slug);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 10 * 60 * 1000 }
      );
    })();
  }, []);
}
