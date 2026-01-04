import { create } from "zustand";

interface UIState {
  // Modals
  isSearchModalOpen: boolean;
  isFilterModalOpen: boolean;
  isAuthModalOpen: boolean;
  authModalType: "login" | "register" | null;

  // Mobile menu
  isMobileMenuOpen: boolean;

  // Theme (managed by next-themes, but we can track it here)
  theme: "light" | "dark" | "system";

  // Notifications
  notifications: Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
    timestamp: number;
  }>;

  // Actions
  openSearchModal: () => void;
  closeSearchModal: () => void;
  openFilterModal: () => void;
  closeFilterModal: () => void;
  openAuthModal: (type: "login" | "register") => void;
  closeAuthModal: () => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  addNotification: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isSearchModalOpen: false,
  isFilterModalOpen: false,
  isAuthModalOpen: false,
  authModalType: null,
  isMobileMenuOpen: false,
  theme: "system",
  notifications: [],

  openSearchModal: () => set({ isSearchModalOpen: true }),
  closeSearchModal: () => set({ isSearchModalOpen: false }),

  openFilterModal: () => set({ isFilterModalOpen: true }),
  closeFilterModal: () => set({ isFilterModalOpen: false }),

  openAuthModal: (type) =>
    set({ isAuthModalOpen: true, authModalType: type }),
  closeAuthModal: () =>
    set({ isAuthModalOpen: false, authModalType: null }),

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),

  setTheme: (theme) => set({ theme }),

  addNotification: (message, type = "info") => {
    const id = Date.now().toString();
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id,
          message,
          type,
          timestamp: Date.now(),
        },
      ],
    }));

    // Auto remove after 5 seconds
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
