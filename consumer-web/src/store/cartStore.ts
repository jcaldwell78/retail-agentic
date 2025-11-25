import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cart, CartItem as ApiCartItem } from '@/lib/api';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;

  // Actions
  setCart: (cart: Cart) => void;
  addItem: (item: ApiCartItem) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Cart state store using Zustand
 * Persists to localStorage automatically
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: null,
      loading: false,
      error: null,

      setCart: (cart) => set({ cart, error: null }),

      addItem: (item) =>
        set((state) => {
          if (!state.cart) return state;

          const existingItemIndex = state.cart.items.findIndex(
            (i) => i.productId === item.productId
          );

          let updatedItems: ApiCartItem[];
          if (existingItemIndex >= 0) {
            // Update existing item quantity
            updatedItems = [...state.cart.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity:
                updatedItems[existingItemIndex].quantity + item.quantity,
            };
          } else {
            // Add new item
            updatedItems = [...state.cart.items, item];
          }

          return {
            cart: {
              ...state.cart,
              items: updatedItems,
            },
          };
        }),

      updateItemQuantity: (itemId, quantity) =>
        set((state) => {
          if (!state.cart) return state;

          const updatedItems = state.cart.items.map((item) =>
            item.productId === itemId ? { ...item, quantity } : item
          );

          return {
            cart: {
              ...state.cart,
              items: updatedItems,
            },
          };
        }),

      removeItem: (itemId) =>
        set((state) => {
          if (!state.cart) return state;

          const updatedItems = state.cart.items.filter(
            (item) => item.productId !== itemId
          );

          return {
            cart: {
              ...state.cart,
              items: updatedItems,
            },
          };
        }),

      clearCart: () => set({ cart: null, error: null }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
