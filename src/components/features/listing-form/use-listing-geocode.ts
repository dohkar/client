"use client";

import { useCallback, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { reverseGeocode } from "@/lib/dadata-geocoder";
import type { GeocodeResult } from "@/lib/dadata-geocoder";
import type { RegionDto } from "@/types/property";
import type { ListingFormData } from "./schema";
import { applyGeocodeResultToListingForm } from "./apply-address-from-dadata";
import { toast } from "sonner";

/**
 * Геолокация → координаты и разбор адреса через DaData (обратное геокодирование).
 */
export function useListingFormLocation(
  setValue: UseFormSetValue<ListingFormData>,
  options: { enabled: boolean; regions: RegionDto[] }
) {
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  const handleGeolocationPosition = useCallback(
    async (lat: number, lon: number) => {
      if (!options.enabled) return;
      setIsResolvingLocation(true);
      try {
        const rev = await reverseGeocode(lat, lon);
        if (rev) {
          const full: GeocodeResult = {
            latitude: lat,
            longitude: lon,
            formattedAddress: rev.formattedAddress,
            components: rev.components,
          };
          await applyGeocodeResultToListingForm(full, setValue, options.regions);
          toast.success("Адрес обновлён по геолокации", { duration: 1200 });
        } else {
          setValue("realEstate.latitude", lat);
          setValue("realEstate.longitude", lon);
          setValue("location", `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
          toast.warning("Координаты сохранены, адрес уточните вручную.", {
            duration: 2500,
          });
        }
      } finally {
        setIsResolvingLocation(false);
      }
    },
    [options.enabled, options.regions, setValue]
  );

  return { handleGeolocationPosition, isResolvingLocation };
}
