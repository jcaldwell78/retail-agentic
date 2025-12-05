/**
 * Product types for the Retail Agentic platform
 */

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: ProductImage[];
  categories: string[];
  tags: string[];
  attributes: Record<string, unknown>;
  variants?: ProductVariant[];
  inventory: ProductInventory;
  status: ProductStatus;
  seoMetadata?: SeoMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  order: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  attributes: Record<string, string>;
  inventory: ProductInventory;
  imageId?: string;
}

export interface ProductInventory {
  quantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  slug?: string;
}

export interface ProductSearchFilters {
  categories?: string[];
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  attributes?: Record<string, string[]>;
  query?: string;
  status?: ProductStatus;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  facets?: SearchFacets;
}

export interface SearchFacets {
  categories: FacetValue[];
  priceRanges: FacetValue[];
  attributes: Record<string, FacetValue[]>;
}

export interface FacetValue {
  value: string;
  count: number;
}
