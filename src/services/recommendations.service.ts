import { API_ENDPOINTS } from "@/constants/routes";
import { apiClient } from "@/lib/api-client";
import type { PropertyBackend } from "@/types/property";

export interface RecommendationResult {
  property: PropertyBackend;
  reason: string;
  score: number;
}

export interface TrackEventDto {
  eventType: "VIEW" | "DETAIL_VIEW" | "FAVORITE" | "CONTACT" | "SEARCH";
  propertyId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export const recommendationsService = {
  async getRecommendations(params: {
    limit?: number;
    exclude?: string[];
  }): Promise<RecommendationResult[]> {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.exclude?.length) query.set("exclude", params.exclude.join(","));

    const url = query.toString()
      ? `${API_ENDPOINTS.recommendations.list}?${query.toString()}`
      : API_ENDPOINTS.recommendations.list;

    return apiClient.get<RecommendationResult[]>(url);
  },

  async trackEvent(dto: TrackEventDto): Promise<void> {
    await apiClient.post(API_ENDPOINTS.recommendations.track, dto);
  },
};
