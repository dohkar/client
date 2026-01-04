import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Property } from "@/types/property";

interface FavoritesState {
  favorites: string[]; // Array of property IDs
  isLoading: boolean;
  error: string | null;

  // Actions
  addFavorite: (propertyId: string) => void;
  removeFavorite: (propertyId: string) => void;
  toggleFavorite: (propertyId: string) => void;
  clearFavorites: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  isFavorite: (propertyId: string) => boolean;
  getFavoriteCount: () => number;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,
      error: null,

      addFavorite: (propertyId) => {
        const { favorites } = get();
        if (!favorites.includes(propertyId)) {
          set({ favorites: [...favorites, propertyId] });
        }
      },

      removeFavorite: (propertyId) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== propertyId),
        }));
      },

      toggleFavorite: (propertyId) => {
        const { isFavorite, addFavorite, removeFavorite } = get();
        if (isFavorite(propertyId)) {
          removeFavorite(propertyId);
        } else {
          addFavorite(propertyId);
        }
      },

      clearFavorites: () => set({ favorites: [] }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      isFavorite: (propertyId) => {
        return get().favorites.includes(propertyId);
      },

      getFavoriteCount: () => {
        return get().favorites.length;
      },
    }),
    {
      name: "favorites-store",
    }
  )
);
