"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { geocodeAddress, reverseGeocode } from "@/lib/yandex-geocoder";
import { buildLocationFromComponents } from "./schema";
import { REGION_LABELS } from "@/lib/search-constants";
import type { PropertyFormData } from "./schema";
import { toast } from "sonner";

const GEOCODE_DELAY_MS = 400;
const REVERSE_GEOCODE_DELAY_MS = 400;

export function usePropertyFormGeocode(
  setValue: UseFormSetValue<PropertyFormData>,
  options: {
    selectedRegion: string;
    cityId: string;
    cityName: string;
    street: string | undefined;
    house: string | undefined;
  }
) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseGeocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coordsSourceRef = useRef<"geocode" | "map" | null>(null);

  useEffect(
    () => () => {
      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);

    const regionRu =
      REGION_LABELS[options.selectedRegion] ??
      (options.selectedRegion === "Other" ? "Россия" : "");
    const query = buildLocationFromComponents({
      region: regionRu,
      city: options.cityName,
      street: options.street?.trim(),
      house: options.house?.trim(),
    });

    const hasAddressSignal = Boolean(options.cityName || options.street?.trim());
    if (!hasAddressSignal || !query || query.length < 5) {
      setValue("latitude", undefined);
      setValue("longitude", undefined);
      return;
    }

    if (coordsSourceRef.current === "map") return;

    coordsSourceRef.current = "geocode";
    setIsGeocoding(true);
    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await geocodeAddress({
          region: regionRu,
          city: options.cityName,
          street: options.street?.trim(),
          house: options.house?.trim(),
        });

        if (result.ok) {
          const { data } = result;
          if (coordsSourceRef.current === "map") return;
          setValue("latitude", data.latitude);
          setValue("longitude", data.longitude);
          setValue("location", data.formattedAddress);
          if (data.components.street) setValue("street", data.components.street);
          if (data.components.house) setValue("house", data.components.house);
          toast.success("Координаты определены", { duration: 1200 });
        } else {
          setValue("latitude", undefined);
          setValue("longitude", undefined);
          if (result.reason === "key") {
            toast.error(
              result.message ?? "Сервис геокодирования не настроен. Обратитесь к администратору.",
              { duration: 5000 }
            );
          } else {
            toast.warning("Не удалось определить координаты. Проверьте адрес.", {
              duration: 2500,
            });
          }
        }
      } catch {
        setValue("latitude", undefined);
        setValue("longitude", undefined);
      } finally {
        setIsGeocoding(false);
      }
    }, GEOCODE_DELAY_MS);

    return () => {
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    };
  }, [
    options.selectedRegion,
    options.cityId,
    options.cityName,
    options.street,
    options.house,
    setValue,
  ]);

  const handleMapCoordinatesChange = useCallback(
    async (lat: number, lon: number) => {
      coordsSourceRef.current = "map";
      setValue("latitude", lat);
      setValue("longitude", lon);

      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current);
      }

      reverseGeocodeTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await reverseGeocode(lat, lon);
          if (result) {
            setValue("location", result.formattedAddress);
            if (result.components.street) setValue("street", result.components.street);
            if (result.components.house) setValue("house", result.components.house);
            toast.success("Адрес обновлён по карте", { duration: 1200 });
          }
        } finally {
          // Оставляем "map", чтобы следующий эффект геокодирования (от setValue street/house/location)
          // не перезаписал координаты, выставленные пользователем на карте
          coordsSourceRef.current = "map";
        }
      }, REVERSE_GEOCODE_DELAY_MS);
    },
    [setValue]
  );

  return { isGeocoding, handleMapCoordinatesChange, coordsSourceRef };
}
