import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PropertyType } from "@/types/property";

export interface ListingFilters {
  query: string;
  /** Для недвижимости используем `PropertyType` как тип объекта. */
  type: PropertyType | "all";
  priceMin: number | null;
  priceMax: number | null;
  roomsMin: number | null;
  areaMin: number | null;
  region: "Chechnya" | "Ingushetia" | "Other" | "all";
  cityId: string | null;
  sortBy: "price-asc" | "price-desc" | "date-desc" | "relevance";
}

interface ListingFiltersState {
  filters: ListingFilters;
  updateFilters: (filters: Partial<ListingFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: ListingFilters = {
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

export const useListingFiltersStore = create<ListingFiltersState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      updateFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: { ...defaultFilters } }),
    }),
    {
      name: "listing-filters",
      version: 1,
      partialize: (state) => ({ filters: state.filters }),
    }
  )
);

