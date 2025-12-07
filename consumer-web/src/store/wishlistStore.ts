import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string; // Unique wishlist item ID
  productId: string;
  variantId?: string; // For products with variants (color, size, etc.)
  name: string;
  price: number;
  priceWhenAdded: number; // Track original price for price drop detection
  currentPrice: number; // Current price (updated)
  imageUrl?: string;
  inStock: boolean;
  addedAt: string;
  priceAlertEnabled: boolean; // Enable/disable price drop notifications
  priceAlertThreshold?: number; // Percentage drop to trigger alert (e.g., 10 = 10%)
  stockAlertEnabled: boolean; // Enable/disable back-in-stock notifications
  notes?: string; // Private notes about the product
  onSale?: boolean; // Is product currently on sale
  salePercentage?: number; // Sale discount percentage
}

export interface WishlistViewPreferences {
  viewMode: 'grid' | 'list'; // Grid or list view
  sortBy: 'recent' | 'priceAsc' | 'priceDesc' | 'name'; // Sort order
  filterBy: 'all' | 'available' | 'onSale'; // Filter criteria
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;
  viewPreferences: WishlistViewPreferences;

  // Actions
  addItem: (item: Omit<WishlistItem, 'id' | 'addedAt' | 'currentPrice'>) => void;
  removeItem: (itemId: string) => void;
  toggleItem: (product: {
    productId: string;
    variantId?: string;
    name: string;
    price: number;
    imageUrl?: string;
    inStock: boolean;
  }) => void;
  updateItem: (itemId: string, updates: Partial<WishlistItem>) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string, variantId?: string) => boolean;
  getItemByProductId: (productId: string, variantId?: string) => WishlistItem | undefined;
  getItemCount: () => number;
  getPriceDrop: (itemId: string) => number; // Calculate price drop percentage
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortBy: (sortBy: WishlistViewPreferences['sortBy']) => void;
  setFilterBy: (filterBy: WishlistViewPreferences['filterBy']) => void;
  getSortedAndFilteredItems: () => WishlistItem[];
}

/**
 * Enhanced Wishlist state store using Zustand
 * Persists to localStorage automatically
 *
 * Features:
 * - Price drop tracking and alerts
 * - Stock availability alerts
 * - Product variants support
 * - Private notes
 * - Grid/List view modes
 * - Sort and filter options
 * - Optimistic updates
 */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,
      viewPreferences: {
        viewMode: 'grid',
        sortBy: 'recent',
        filterBy: 'all',
      },

      addItem: (item) =>
        set((state) => {
          // Check if item already exists
          const exists = state.items.some(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );
          if (exists) {
            return state;
          }

          const newItem: WishlistItem = {
            ...item,
            id: `wishlist-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            addedAt: new Date().toISOString(),
            currentPrice: item.price,
            priceWhenAdded: item.price,
            priceAlertEnabled: item.priceAlertEnabled ?? false,
            stockAlertEnabled: item.stockAlertEnabled ?? false,
          };

          return {
            items: [...state.items, newItem],
            error: null,
          };
        }),

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
          error: null,
        })),

      toggleItem: (product) => {
        const { items } = get();
        const existingItem = items.find(
          (item) => item.productId === product.productId &&
                    item.variantId === product.variantId
        );

        if (existingItem) {
          get().removeItem(existingItem.id);
        } else {
          get().addItem({
            productId: product.productId,
            variantId: product.variantId,
            name: product.name,
            price: product.price,
            priceWhenAdded: product.price,
            imageUrl: product.imageUrl,
            inStock: product.inStock,
            priceAlertEnabled: false,
            stockAlertEnabled: false,
          });
        }
      },

      updateItem: (itemId, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
          error: null,
        })),

      clearWishlist: () => set({ items: [], error: null }),

      isInWishlist: (productId, variantId) => {
        return get().items.some(
          (item) => item.productId === productId &&
                    (variantId ? item.variantId === variantId : true)
        );
      },

      getItemByProductId: (productId, variantId) => {
        return get().items.find(
          (item) => item.productId === productId &&
                    (variantId ? item.variantId === variantId : true)
        );
      },

      getItemCount: () => get().items.length,

      getPriceDrop: (itemId) => {
        const item = get().items.find((i) => i.id === itemId);
        if (!item) return 0;

        const drop = ((item.priceWhenAdded - item.currentPrice) / item.priceWhenAdded) * 100;
        return Math.max(0, drop); // Return 0 if price increased
      },

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      setViewMode: (mode) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, viewMode: mode },
        })),

      setSortBy: (sortBy) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, sortBy },
        })),

      setFilterBy: (filterBy) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, filterBy },
        })),

      getSortedAndFilteredItems: () => {
        const { items, viewPreferences } = get();
        let filtered = [...items];

        // Apply filters
        switch (viewPreferences.filterBy) {
          case 'available':
            filtered = filtered.filter((item) => item.inStock);
            break;
          case 'onSale':
            filtered = filtered.filter((item) => item.onSale);
            break;
          default:
            // 'all' - no filter
            break;
        }

        // Apply sorting
        switch (viewPreferences.sortBy) {
          case 'priceAsc':
            filtered.sort((a, b) => a.currentPrice - b.currentPrice);
            break;
          case 'priceDesc':
            filtered.sort((a, b) => b.currentPrice - a.currentPrice);
            break;
          case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'recent':
          default:
            filtered.sort((a, b) =>
              new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
            );
            break;
        }

        return filtered;
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({
        items: state.items,
        viewPreferences: state.viewPreferences,
      }),
    }
  )
);
