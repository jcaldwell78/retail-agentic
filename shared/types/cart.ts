/**
 * Shopping cart types for the Retail Agentic platform
 */

export interface Cart {
  id: string;
  tenantId: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string;
  attributes?: Record<string, string>;
}

export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  currency: string;
}
