import { api } from './client';
import type { Product } from './types';

const BASE_PATH = '/api/v1/products';

/**
 * Product API service
 */
export const productsApi = {
  /**
   * Get all products (paginated)
   */
  getAll: async (page = 0, size = 20): Promise<Product[]> => {
    return api.get<Product[]>(`${BASE_PATH}`, {
      params: { page, size },
    });
  },

  /**
   * Get product by ID
   */
  getById: async (id: string): Promise<Product> => {
    return api.get<Product>(`${BASE_PATH}/${id}`);
  },

  /**
   * Get product by SKU
   */
  getBySku: async (sku: string): Promise<Product> => {
    return api.get<Product>(`${BASE_PATH}/sku/${sku}`);
  },

  /**
   * Get products by category
   */
  getByCategory: async (
    category: string,
    page = 0,
    size = 20
  ): Promise<Product[]> => {
    return api.get<Product[]>(`${BASE_PATH}/category/${category}`, {
      params: { page, size },
    });
  },

  /**
   * Search products
   */
  search: async (query: string, page = 0, size = 20): Promise<Product[]> => {
    return api.get<Product[]>(`${BASE_PATH}/search`, {
      params: { query, page, size },
    });
  },

  /**
   * Get active products only
   */
  getActive: async (page = 0, size = 20): Promise<Product[]> => {
    return api.get<Product[]>(`${BASE_PATH}/active`, {
      params: { page, size },
    });
  },

  /**
   * Create product (admin only)
   */
  create: async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    return api.post<Product>(`${BASE_PATH}`, data);
  },

  /**
   * Update product (admin only)
   */
  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    return api.put<Product>(`${BASE_PATH}/${id}`, data);
  },

  /**
   * Delete product (admin only)
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  /**
   * Count total products
   */
  count: async (): Promise<number> => {
    return api.get<number>(`${BASE_PATH}/count`);
  },

  /**
   * Count active products
   */
  countActive: async (): Promise<number> => {
    return api.get<number>(`${BASE_PATH}/count/active`);
  },
};
