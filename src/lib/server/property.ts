/**
 * Серверные функции для получения данных о недвижимости
 * Используются в Server Components для SSR/ISR
 */

import { cache } from "react";
import type { Property } from "@/types/property";
import type { PaginatedResponse } from "@/types";
import { adaptProperty } from "@/lib/property-adapter";
import type { PropertyBackend } from "@/types/property";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * Получить объявление по ID (с кешированием через React cache)
 * Используется в layout и page для избежания дублирующих запросов
 */
export const getProperty = cache(async (id: string): Promise<Property | null> => {
  try {
    const response = await fetch(`${API_URL}/properties/${id}`, {
      next: { revalidate: 300 }, // ISR: 5 минут
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch property: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === "success" && data.data) {
      return adaptProperty(data.data as PropertyBackend);
    }

    return null;
  } catch (error) {
    // Server-side error logging
    if (typeof window === "undefined") {
      console.error("Error fetching property:", error);
    }
    return null;
  }
});

/**
 * Получить список объявлений с фильтрами
 */
export async function getProperties(params?: {
  query?: string;
  type?: string;
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  areaMin?: number;
  regionId?: string;
  cityId?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Property>> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.query) queryParams.append("query", params.query);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.priceMin) queryParams.append("priceMin", params.priceMin.toString());
    if (params?.priceMax) queryParams.append("priceMax", params.priceMax.toString());
    if (params?.rooms) queryParams.append("rooms", params.rooms.toString());
    if (params?.areaMin) queryParams.append("areaMin", params.areaMin.toString());
    if (params?.regionId) queryParams.append("regionId", params.regionId);
    if (params?.cityId) queryParams.append("cityId", params.cityId);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString
      ? `${API_URL}/properties?${queryString}`
      : `${API_URL}/properties`;

    const response = await fetch(url, {
      next: { revalidate: 300 }, // ISR: 5 минут
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.status}`);
    }

    const data = await response.json();

    // Адаптируем данные
    const adaptedData = data.data.map((item: PropertyBackend) => adaptProperty(item));

    return {
      data: adaptedData,
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    };
  } catch (error) {
    // Server-side error logging
    if (typeof window === "undefined") {
      console.error("Error fetching properties:", error);
    }
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
    };
  }
}

/**
 * Получить регионы (с длинным кешем)
 */
export const getRegions = cache(async () => {
  try {
    const response = await fetch(`${API_URL}/regions`, {
      next: { revalidate: 3600 }, // 1 час - регионы меняются редко
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch regions: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    // Server-side error logging
    if (typeof window === "undefined") {
      console.error("Error fetching regions:", error);
    }
    return [];
  }
});
