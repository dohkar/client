import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Property, PropertyType } from "@/types/property";

export interface PropertyFilters {
  query: string;
  type: PropertyType | "all";
  priceMin: number | null;
  priceMax: number | null;
  roomsMin: number | null;
  areaMin: number | null;
  region: "Chechnya" | "Ingushetia" | "Other" | "all";
  cityId: string | null;
  sortBy: "price-asc" | "price-desc" | "date-desc" | "relevance";
}

interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  filters: PropertyFilters;
  isLoading: boolean;
  error: string | null;

  setProperties: (properties: Property[]) => void;
  setSelectedProperty: (property: Property | null) => void;
  updateFilters: (filters: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultFilters: PropertyFilters = {
  query: "",
  type: "all",
  priceMin: null,
  priceMax: null,
  roomsMin: null,
  areaMin: null,
  region: "all",
  cityId: null,
  sortBy: "relevance",
};

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set) => ({
      properties: [],
      selectedProperty: null,
      filters: defaultFilters,
      isLoading: false,
      error: null,

      setProperties: (properties: Property[]) => set({ properties }),

      setSelectedProperty: (property: Property | null) =>
        set({ selectedProperty: property }),

      updateFilters: (newFilters: Partial<PropertyFilters>) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      resetFilters: () => set({ filters: { ...defaultFilters } }),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | null) => set({ error }),
    }),
    {
      name: "property-store",
      version: 1,
      // Сохраняем только filters - не сохраняем properties (слишком большой массив)
      // и selectedProperty (не нужно между сессиями)
      partialize: (state) => ({
        filters: state.filters,
      }),
      // Миграция для старых версий store
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { filters?: Partial<PropertyFilters> };
        const filters = state?.filters ? { ...defaultFilters, ...state.filters } : defaultFilters;
        if (filters.cityId === undefined) {
          (filters as PropertyFilters).cityId = null;
        }
        return { filters };
      },
    }
  )
);
