import { useState, useEffect, useCallback, useRef } from 'react';
import { recentlyViewedApi } from '@/lib/api/recentlyViewed';
import { useUserStore } from '@/store/userStore';
import type { Product } from '@/lib/api/types';

const GUEST_ID_KEY = 'guest_session_id';

/**
 * Generate or retrieve a guest session ID for anonymous users
 */
function getGuestId(): string {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

/**
 * Get the effective user ID (authenticated user ID or guest ID)
 */
function getEffectiveUserId(userId: string | undefined): string {
  return userId || getGuestId();
}

interface UseRecentlyViewedOptions {
  /** Maximum number of products to fetch (default: 10) */
  limit?: number;
  /** Whether to automatically fetch on mount (default: true) */
  autoFetch?: boolean;
}

interface UseRecentlyViewedReturn {
  /** List of recently viewed products */
  products: Product[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Total count of recently viewed products */
  count: number;
  /** Refresh the recently viewed products list */
  refresh: () => Promise<void>;
  /** Record a product view */
  recordView: (productId: string) => Promise<void>;
  /** Remove a product from recently viewed */
  remove: (productId: string) => Promise<void>;
  /** Clear all recently viewed products */
  clear: () => Promise<void>;
  /** Check if a product is recently viewed */
  isViewed: (productId: string) => boolean;
}

/**
 * Hook to manage recently viewed products
 * Handles both authenticated users and guests with session merging
 */
export function useRecentlyViewed(options: UseRecentlyViewedOptions = {}): UseRecentlyViewedReturn {
  const { limit = 10, autoFetch = true } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  // Track viewed product IDs for quick lookup
  const viewedIdsRef = useRef<Set<string>>(new Set());

  // Get user state from store
  const { user, isAuthenticated } = useUserStore();
  const effectiveUserId = getEffectiveUserId(user?.id);

  // Track if we've already merged guest data
  const hasMergedRef = useRef(false);

  /**
   * Fetch recently viewed products
   */
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [fetchedProducts, fetchedCount] = await Promise.all([
        recentlyViewedApi.getProducts(effectiveUserId, limit),
        recentlyViewedApi.getCount(effectiveUserId),
      ]);

      setProducts(fetchedProducts);
      setCount(fetchedCount);

      // Update the viewed IDs set
      viewedIdsRef.current = new Set(fetchedProducts.map((p) => p.id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch recently viewed products'));
      console.error('Error fetching recently viewed products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, limit]);

  /**
   * Record a product view
   */
  const recordView = useCallback(
    async (productId: string) => {
      try {
        await recentlyViewedApi.recordView(effectiveUserId, productId);
        viewedIdsRef.current.add(productId);
        // Optionally refresh the list in the background
        fetchProducts();
      } catch (err) {
        console.error('Error recording product view:', err);
      }
    },
    [effectiveUserId, fetchProducts]
  );

  /**
   * Remove a product from recently viewed
   */
  const remove = useCallback(
    async (productId: string) => {
      try {
        await recentlyViewedApi.remove(effectiveUserId, productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setCount((prev) => Math.max(0, prev - 1));
        viewedIdsRef.current.delete(productId);
      } catch (err) {
        console.error('Error removing product from recently viewed:', err);
        throw err;
      }
    },
    [effectiveUserId]
  );

  /**
   * Clear all recently viewed products
   */
  const clear = useCallback(async () => {
    try {
      await recentlyViewedApi.clear(effectiveUserId);
      setProducts([]);
      setCount(0);
      viewedIdsRef.current.clear();
    } catch (err) {
      console.error('Error clearing recently viewed products:', err);
      throw err;
    }
  }, [effectiveUserId]);

  /**
   * Check if a product is in the recently viewed list
   */
  const isViewed = useCallback((productId: string): boolean => {
    return viewedIdsRef.current.has(productId);
  }, []);

  /**
   * Merge guest data when user logs in
   */
  useEffect(() => {
    const mergeGuestData = async () => {
      if (isAuthenticated && user?.id && !hasMergedRef.current) {
        const guestId = localStorage.getItem(GUEST_ID_KEY);
        if (guestId) {
          try {
            await recentlyViewedApi.merge(guestId, user.id);
            // Clear the guest ID after successful merge
            localStorage.removeItem(GUEST_ID_KEY);
            hasMergedRef.current = true;
            // Refresh to get merged data
            fetchProducts();
          } catch (err) {
            console.error('Error merging guest recently viewed to user:', err);
          }
        }
      }
    };

    mergeGuestData();
  }, [isAuthenticated, user?.id, fetchProducts]);

  /**
   * Auto-fetch on mount if enabled
   */
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  return {
    products,
    isLoading,
    error,
    count,
    refresh: fetchProducts,
    recordView,
    remove,
    clear,
    isViewed,
  };
}

/**
 * Hook to record product views on product detail pages
 * Automatically records the view when mounted
 */
export function useRecordProductView(productId: string | undefined) {
  const { user } = useUserStore();
  const effectiveUserId = getEffectiveUserId(user?.id);
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (productId && !hasRecordedRef.current) {
      recentlyViewedApi.recordView(effectiveUserId, productId).catch((err) => {
        console.error('Error recording product view:', err);
      });
      hasRecordedRef.current = true;
    }

    // Reset when productId changes
    return () => {
      hasRecordedRef.current = false;
    };
  }, [productId, effectiveUserId]);
}

export default useRecentlyViewed;
