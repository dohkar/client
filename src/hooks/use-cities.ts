import { useQuery } from "@tanstack/react-query";
import { regionsService } from "@/services/regions.service";
import type { CityDto } from "@/types/property";

/**
 * Хук для загрузки списка городов (опционально по региону).
 * regionId — ID региона; при undefined возвращаются все города.
 */
export function useCities(regionId?: string | null) {
  return useQuery({
    queryKey: ["cities", regionId ?? "all"],
    queryFn: () => regionsService.getCities(regionId ?? undefined),
    staleTime: 5 * 60 * 1000, // 5 минут — список городов меняется редко
    enabled: true,
  });
}

export type { CityDto };
