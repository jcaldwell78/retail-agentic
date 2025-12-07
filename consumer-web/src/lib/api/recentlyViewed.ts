import { api } from './client';
import type { Product } from './types';

/**
 * Recently Viewed Products API client
 * Interfaces with the backend to track and retrieve browsing history
 */

const BASE_URL = '/api/v1/recently-viewed';

/**
 * Record that a user viewed a product
 */
export async function recordProductView(userId: string, productId: string): Promise<void> {
  await api.post<void>(`${BASE_URL}/users/${userId}/products/${productId}`);
}

/**
 * Get recently viewed products for a user
 * @param userId User or guest session ID
 * @param limit Maximum number of products to return (default 10, max 20)
 */
export async function getRecentlyViewed(userId: string, limit = 10): Promise<Product[]> {
  return api.get<Product[]>(`${BASE_URL}/users/${userId}`, {
    params: { limit: Math.min(limit, 20) },
  });
}

/**
 * Get recently viewed product IDs only (lightweight)
 */
export async function getRecentlyViewedIds(userId: string, limit = 10): Promise<string[]> {
  return api.get<string[]>(`${BASE_URL}/users/${userId}/ids`, {
    params: { limit: Math.min(limit, 20) },
  });
}

/**
 * Get count of recently viewed products
 */
export async function getRecentlyViewedCount(userId: string): Promise<number> {
  const response = await api.get<{ count: number }>(`${BASE_URL}/users/${userId}/count`);
  return response.count;
}

/**
 * Check if a product is in the recently viewed list
 */
export async function isProductRecentlyViewed(userId: string, productId: string): Promise<boolean> {
  const response = await api.get<{ exists: boolean }>(
    `${BASE_URL}/users/${userId}/products/${productId}/exists`
  );
  return response.exists;
}

/**
 * Remove a product from the recently viewed list
 */
export async function removeFromRecentlyViewed(userId: string, productId: string): Promise<void> {
  await api.delete<void>(`${BASE_URL}/users/${userId}/products/${productId}`);
}

/**
 * Clear all recently viewed products for a user
 */
export async function clearRecentlyViewed(userId: string): Promise<void> {
  await api.delete<void>(`${BASE_URL}/users/${userId}`);
}

/**
 * Merge guest session's recently viewed products to logged-in user
 */
export async function mergeGuestToUser(guestId: string, userId: string): Promise<void> {
  await api.post<void>(`${BASE_URL}/merge`, { guestId, userId });
}

export const recentlyViewedApi = {
  recordView: recordProductView,
  getProducts: getRecentlyViewed,
  getProductIds: getRecentlyViewedIds,
  getCount: getRecentlyViewedCount,
  isViewed: isProductRecentlyViewed,
  remove: removeFromRecentlyViewed,
  clear: clearRecentlyViewed,
  merge: mergeGuestToUser,
};
