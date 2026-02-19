"use client";

import { useQuery } from "@tanstack/react-query";
import { recommendationsService } from "@/services/recommendations.service";

export function useRecommendations(options: {
  limit?: number;
  excludeIds?: string[];
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["recommendations", options.limit ?? 8, options.excludeIds ?? []],
    queryFn: () =>
      recommendationsService.getRecommendations({
        limit: options.limit ?? 8,
        exclude: options.excludeIds,
      }),
    staleTime: 5 * 60 * 1000,
    enabled: options.enabled !== false,
    retry: 1,
  });
}
