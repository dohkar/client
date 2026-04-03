import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favorites: string[]; // listingId (и локально для гостей)
  isLoading: boolean;
  error: string | null;

  // Actions
  addFavorite: (listingId: string) => void;
  removeFavorite: (listingId: string) => void;
  toggleFavorite: (listingId: string) => void;
  clearFavorites: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  isFavorite: (listingId: string) => boolean;
  getFavoriteCount: () => number;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,
      error: null,

      addFavorite: (listingId) => {
        const { favorites } = get();
        if (!favorites.includes(listingId)) {
          set({ favorites: [...favorites, listingId] });
        }
      },

      removeFavorite: (listingId) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== listingId),
        }));
      },

      toggleFavorite: (listingId) => {
        const { isFavorite, addFavorite, removeFavorite } = get();
        if (isFavorite(listingId)) {
          removeFavorite(listingId);
        } else {
          addFavorite(listingId);
        }
      },

      clearFavorites: () => set({ favorites: [] }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      isFavorite: (listingId) => {
        return get().favorites.includes(listingId);
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
