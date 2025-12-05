import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  inStock: boolean;
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;

  // Actions
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Wishlist state store using Zustand
 * Persists to localStorage automatically
 */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,

      addItem: (item) =>
        set((state) => {
          // Check if item already exists
          const exists = state.items.some((i) => i.productId === item.productId);
          if (exists) {
            return state;
          }

          return {
            items: [...state.items, { ...item, addedAt: new Date().toISOString() }],
            error: null,
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
          error: null,
        })),

      clearWishlist: () => set({ items: [], error: null }),

      isInWishlist: (productId) => {
        return get().items.some((item) => item.productId === productId);
      },

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
